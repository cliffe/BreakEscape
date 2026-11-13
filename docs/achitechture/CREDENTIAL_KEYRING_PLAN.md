# Credential keyring: build plan for phases 0 and 1

Status: plan. Decided by the user on 2026-11-13 (q92, option 3: "remote sign-in model: credential keyring, option 3"). Engine paths are under `public/break_escape/js/`; the Ruby files cited by bare name (`game.rb`, `network_access.rb`, `capture_proofs.rb`, `npc_frustration.rb`) are under `app/models/break_escape/`, and `games_controller.rb` is under `app/controllers/break_escape/`. Line numbers are on main 1ce7486c7, which contains UX slice 2b0 (remote sign-in captured tiles), the conclude-race fix and the rfid server-trust fix.

## 1. What this builds

A **credential** is anything the player holds that a PC accepts as proof that they are a particular account. The player's **keyring** is the list of credentials they have earned, computed on the server from state it already keeps. Each PC's policy says which kinds it accepts, and the server checks every use.

| Phase | Scope | Slices | Size |
|---|---|---|---|
| 0 | Policy `remoteScreen`; the target PC's own account tiles on the remote sign-in screen, passwords only | K0 | M |
| 1 | The `credentials` registry, the `held` and `foothold` proofs, policy `accepts`, the POST /login credential branch, credentials on sign-in screens, Connect, the relay; kinds `password` (found in files), `saved_connection`, `assist_invite` | K1, K2, K3a, K3b, K3c, K4 | L in all (M each) |
| 1, follow-up | Foothold and `from` credential sessions lockable under UI slice 6's session lock | K-lock (section 8.6) | S |
| 2 | `token` | sketch, section 10 | M |
| 3 | `hash`, `acceptedOn`, machine accounts | sketch, section 11 | M |

Each slice is one branch, built, reviewed and live-proved on its own, and merged before the next starts. K0 also waits for decision D1 before it merges, since it changes a shipped lab's screens. Main stays playable and safe between slices: K1 changes no sign-in behaviour, K2 adds a server branch that nothing in the client calls until K3a, and K3a works through footholds alone.

Out of scope: tokens and hashes; converting the labs' hand-written granted sessions (decision D5); the inline item shape; any field tidy that would need a format step (section 12).

### 1.1 Changes from the explainer the user decided from

Each is shown on the picks page. The ones marked "Default" are behaviour the player meets; the user can overturn them.

| Change | Reason |
|---|---|
| The "Use from keyring" button and its list panel become short per-kind tags on each account tile ("Captured", "In file", "Saved", "Assist") and, on the chosen account's line, one button per usable credential ("Connect with HB-FIN-02.rdp") | One action per way in, no one-item menu; one verb, Connect, on the screen, the tray and the desktop. The tags fit a tile whole |
| Default: a password found in a file is never filled in. The tile is tagged and the player types it from the file | The server never sends a password it did not capture; reading the file is the lesson |
| Default: the "In file" tag and its toast wait until the player has opened the file (the explainer listed the account as soon as the proof held) | The tag would give the find away |
| Default: under `remoteScreen: "typed"` the screen still shows the player's own captured sign-ins, tagged (the explainer's typed screen "asks first and shows nothing") | The captures are the player's own notes, not the PC's list; the screen says the PC lists none |
| Default: a refused credential gets a specific answer (wrong PC, policy, lockout, ended) once its proof holds; the explainer refused every failed check as an unknown credential | The proof check runs first, so the browser still cannot probe the registry, and honest play learns why |
| Machine accounts, if built, live in a top-level `machineAccounts` block, not `accounts` (D3) | `accounts` already names `social.mail.accounts` and a `loginPicker` value |
| Default: the invite can also end on a timer (90 seconds in the test scenario) after the relay desktop first opens, as well as through Jake's later ink. The timer shows no countdown (`showCountdown: false`) | Teaches that an invite is short-lived; the ink ending alone may never be reached. No countdown keeps the end a surprise, as a real holder's choice would be; the closing line and Jake's bark name what happened |
| The keyring reaches the client by GET /keyring with a `rev` digest, asked after the events that can change it, not as deltas inside other answers | One reader, no change to every answer that could earn a credential; a repeat costs a few bytes |
| Default: a relay session (assist invite) gives no network reach, maps no shares, is no source for a desktop sign-in, is not listed in the network view, is not offered at the holder's keyboard and ends on reload (the explainer said every route after sign-in is unchanged) | The invite is Jake's own screen shared through his vendor's relay, not a foothold on his network |
| The assist code comes from Jake through an ink gift (`#give_item` from his `itemsHeld`), not a declared grant | A declared grant can be claimed from the first second, skipping the conversation |
| Default: an assist invite is used only by Connect, never from a sign-in screen; a refusal is a toast | Its one route is the relay, which no sign-in screen draws |
| The policy refusal reads "{host} always asks for the password, so a saved one is ignored." in place of "This PC does not allow saved passwords" | Names the control in two lines on a phone; the fix itself is in the saved connection's teaching toast; final wording is D7 |
| Default: a lockout refuses a saved connection too | A saved connection presents the password, so the lockout applies; an assist invite (the person's own session) is not refused. Lockouts never expire (`loginLockouts`, `game.rb:2257-2261`), so a scenario must not make a saved connection the only way to something it needs at a PC with `maxAttempts`: the validator says so (6.3) |
| Default: keyboard screens show password entries only | Connecting kinds are used from somewhere else (section 3.7) |
| The keyring view ("the capture log grown") is not in phase 1 (D4, recommended (c)) | The capture log is carried by one test scenario; the sign-in screens and Connect are where credentials are used |
| Item type `remote_access` becomes an existing type with a tray slot (`text_file`) | No new item art or item type; a small connection icon is logged in the backlog. The only new art is two 8x8 badge glyphs for the short window (section 5.2) |
| `token` leaves the phase 1 default `accepts` | Tokens are phase 2 (D2) |
| The inline item shape (a credential described inside the item) is not accepted | No content uses it; a second shape is a second thing to test |
| New-game conversion of the labs' items moves out of phase 1 (D5) | The honest kind for them is `token` |
| The desktop pivot ("open the .rdp from Sam's desktop") is slice K4 (D6) | It needs its own route and session reader changes |
| Default: Connect signs in directly when the server accepts; a saved connection's sign-in screen opens only to show a policy or lockout refusal | One meaningful action acts directly |
| Default: the relay desktop says whose session it is and has Disconnect, not Switch user and Sign out | The player did not sign in; they were let in |
| The explainer's later kinds (an RFID card as a credential, a one-time code, a key file) are not planned | Logged in `docs/IDEAS_BACKLOG.md` in K1 |

Evidence for the Default rows on the picks page, each beside its alternative (the explainer's behaviour):
- file password never filled, and the "In file" wait: beat R3 and mock m1 (Jake's tile untagged, then tagged with the found-password line), beside a mock of the filled field;
- typed screen still shows captures: the K0 shot of HB-OPS-02, beside the same screen with no tiles;
- specific refusals: mock m2 and the m9 sheet's refusal toasts, beside the generic "Incorrect username or password";
- the invite timer: the 9.1 timer JSON and beat R7a, beside R7b's ink-only ending;
- the relay sink: the R6 view shot (no bridge named after Jake) and the 3.7 route table, beside a view with a `server_lan` block through HB-FIN-03;
- assist invite by Connect only, and lockout refuses a saved connection: mock m9's toasts and K2's check list, with the stranding case spelt out (five wrong passwords lock the account at that PC for the rest of the game, and the saved connection with it);
- keyboard screens show password entries only: a mock of HB-DESK-01's keyboard screen;
- Connect signs in directly: mock m3 and the R2 desktop shot;
- the relay desktop's bar: mock m4.

## 2. What exists today

- **POST /login** (`games_controller.rb:1320`, `Game#attempt_login!` at `game.rb:2141`): a username and password, or a claim, under `with_game_lock`. With `foothold`, the host must be reachable through it (`host_reachable_through?`, `network_access.rb:1171`), on, and not `remote: "blocked"` (`remote_blocked?`, `network_access.rb:856`; refusal text `REMOTE_BLOCKED`, `network_access.rb:951`). Failures count per PC and normalised username (`record_login_failure!`, `game.rb:2867`) up to `maxAttempts`. `start_login_session!` (`game.rb:2914`) writes `sessions[pcId] = { id, via, foothold? }`, one slot per PC, and adds the PC to the grow-only `signedInPcs`.
- **GET /login_accounts** (`games_controller.rb:1363`): the PC's tiles (`login_account_tiles`, `game.rb:2416`, by `loginPicker`: `accounts` (the default), `known` or `false`; each tile `{ username, displayName, portrait, avatar }`, no NPC id) and the sticky note. It judges reach at the keyboard only and answers 403 for a headless PC; a request carrying `foothold` gets no note but is otherwise judged as if the player stood at the PC.
- **The remote sign-in screen** (`systems/unlock-system.js:633`, `openRemoteSignInScreen`) is built from `remoteLockable` (`unlock-system.js:302`), which hard-codes `loginPicker: false` and drops the row's `headless`; it never calls GET /login_accounts and fills the captured sign-ins from GET /capture_secrets. The keyboard screen (`openLoginPc`, `unlock-system.js:260`) opens the desktop at once when the client holds a session at that PC, else after GET /login_accounts answers, and shows no captures.
- **Headless hosts** (no screen: `door_box`, HB-DOOR-01, in `test_access_networks`; LW-DOOR01 in `lab_physical_pentest`, `loginPicker: false` at `scenario.json.erb:2311`) are signed in to only over the network, through the remote screen with no tiles.
- **GET /capture_secrets** (`games_controller.rb:1568`): `secrets` (`capture_secrets_for_client`, `game.rb:1415`) and, in a networks scenario, `accounts` (`account_capture_usernames`, `network_access.rb:1385`). Capture proofs (`capture_proofs.rb`; `planted`, `dropped`, `session`) gate when an account's password is served (`account_capture_served?`, `capture_proofs.rb:104`).
- **Session lock (UI slice 6, not on main yet).** Its server side is final on `build/ui-slice6-lock` (20a8a83a7): a server-side `locked` boolean on the held-session record, sent as a delta; `Game#session_identity` answers nil for a locked session, so every read path treats it as signed out; a lock is refused with 422 for a session that is not a password sign-in; `reach_walk` skips locked session hosts and `reach_cache_key` carries the lock state; the network view shows a locked remote PC as Locked; the client adds `canLock`, and `sessionLockingSupported` is true only with a sign-in PC. Its start panel also replaces the desktop's account bar. K0 to K4 do not depend on it; K-lock (section 8.6) is the only part of this plan that builds on it.
- **Session readers.** `view_session_hosts` (`network_access.rb:812`) reads every session for the network view's bridge labels (`via_for`, `:828`) and down blocks (`network_blocks`, `:772`; `down_blocks`, `:790`). `session_route_up?` (`network_access.rb:1015`) returns true at once for a session with no foothold. `prune_unreachable_sessions!` (`network_access.rb:1150`) skips sessions with no foothold and ignores outages. `reach_session_hosts` (`network_access.rb:1115`) counts every session as a pivot host. `resource_admits_player?` (`network_access.rb:1218`) admits a share through any session whose route is up, across the link walk for an access-listed share. `mapped_shares` (`network_access.rb:1265`) maps every admitted share on networks reachable from the PC, with no test of the session's kind; `find_login_item` (`game.rb:2051`) also searches those mapped shares. `host_row` (`network_access.rb:911`) offers only `via == "password"` sessions with `remote` from the foothold. `desktop_request_allowed?` (`network_access.rb:1183`) judges a foothold request by reach and a request without one by the keyboard. `unlock_session_refusal` (`game.rb:2758`) picks "not responding" or "off" by whether the session has a foothold. `session_for_client` (`game.rb:2400`) answers with the session's foothold only. `render_login_desktop` (`games_controller.rb:2447`) judges a desktop request by foothold and, with none, calls `settle_session_at_keyboard!` (`network_access.rb:1197`), which strips the session's foothold. `end_claimed_sessions!` (`game.rb:2370`) ends claims on reload (`claimed_session_ids`, `game.rb:2385`).
- **Screen look.** `systems/screen-states.js:83` sets only the world sprite's locked look: locked when the workstation is locked and the player's session there is not `via === 'password'`. It does not decide what opens on a click.
- **Sync.** PUT /sync_state (`games_controller.rb:811`) loads `SYNC_STATE_COLUMNS` only, without `scenario_data` (`games_controller.rb:2027`); `merge_global_variables!` (`game.rb:332`) runs there. `prepare_bootstrap_state!` (`game.rb:214`) runs the bootstrap writers (`run_bootstrap_writers!`, `game.rb:839`) with `scenario_data` loaded, but only when `bootstrap_state_needs_write?` (`game.rb:831`) is true. A dropped link reaches the client as `endedPcIds`, which `pc-sessions.js` `linkDropped` handles.
- **Inventory.** Items enter only through `/inventory` and `canonical_inventory_item` (`games_controller.rb:2560`), which stores the server's own copy for a type that is not always-allowed. An always-allowed type (`notepad`, `ALWAYS_ALLOWED_ITEMS`, `games_controller.rb:2523`) has no server source and keeps the client's fields except `CLIENT_ITEM_FORBIDDEN_FIELDS`, built from `ItemIdentity::FORGEABLE_ITEM_FIELDS`. `ItemIdentity.same_item?` falls back to a shared name when ids differ. `ItemIdentity.client_forged?` catches only room adds with no source.
- **Declared grants** (`DeclaredGrants.for`, `lib/break_escape/declared_grants.rb:60`; `Game#declared_grants`, `game.rb:3443`) are server-run actions that put an item in the inventory with no trigger check.
- **Notes items never take a tray slot**: `notes`-family types go to the Notepad (`systems/inventory.js`, `systems/interactions.js`).
- **Inventory menu.** `inventoryMenuFor` (`systems/inventory-menu.js:87`) gives an item with more than one thing to do a small menu. The tray is covered while a minigame or chat is open, and `openInventoryItemMenu` returns without a menu in that state (`inventory-menu.js:171-174`).
- **NPC gifts.** An ink choice gives an item with the `#give_item:<type>:<id>` tag from the speaking NPC's `itemsHeld`; the server checks the NPC holds it.
- **Timers and barks.** Scenario `timers` are a top-level array (`scenario-schema.json:785`), armed by `startOnGlobal` and run in real time. On reload a timer whose start global is true resumes from its saved running time (`ui/scenario-timer-dispatcher.js:86-96`); `README_scenario_design.md:2753` still says it restarts and is out of date. A global set in the browser reaches the server only with the next state sync (about every 30 s). Barks come from event mappings (for example on `global_variable_changed:<name>`), not from timer actions, and wait behind an open minigame. `pc_desktop_opened` carries `{ pcId, npcId, via, restored, remote, footholdId }` (`pc-sessions.js:49, 545`).
- **Displacement.** When an NPC sits down at a PC, `pc-sessions.js` ends any player session there (`displaced`).
- **Policies** ship in the bootstrap. The schema closes each policy. The schema has no cross-reference keyword (only `x-id-map`); references are checked by the validator.
- **The 2b0 remote screen**: captured sign-ins as the shared `.signin-tile` tiles with headshots, under a "Captured sign-ins" heading, above the form, in the PC monitor frame, with a loading state that shows neither form nor tiles until the list arrives. Every captured account with a served password is shown and filled, whatever the PC admits. At 1400x1000 the Other user form plus a refusal line is 14px taller than `.pc-monitor-area` (scrollHeight 364 against clientHeight 350), so a scroller appears inside the monitor.
- **Remote screen wording today**: "Checking..." while loading, a 3 s cap (`REMOTE_CAPTURES_WAIT_MS`, `unlock-system.js:369`) after which the form shows with a "still checking" line that the late answer replaces in place without moving focus; lines "Captured sign-ins: still checking.", "Captured sign-ins could not be loaded.", "Captured sign-ins: none yet.". `signInErrorMessage` (`password-minigame.js:358`) says "This PC is off.", "This PC is not responding.", "This PC can't be reached.". The view's helpers `unreachableMessage(host)` "<host> can't be reached over this link." and `notRespondingMessage(host)` "<host> is not responding." are in `systems/network-links.js:66-68`; `REMOTE_OFF_TEXT` "Remote sign-in off" is in `minigames/network-view/network-view-minigame.js:59`.
- **Monitor frame.** The PC screen draws on a 560x350 base at a whole scale: x2 at 1400x1000 (`utils/pc-monitor.js`, `password-minigame.css`). Tiles are 104px wide with 4px padding and a 2px border (`password-minigame.css:779`), about 11 Press Start 2P glyphs at 8px inside; 84px compact (`css:1067`), about 9.
- **Accounts are room NPCs.** `account_npcs` (`game.rb:1896`) reads only `rooms.*.npcs`.
- **Networks scenarios with sign-in hosts**: `test_access_networks` and `lab_physical_pentest`. In the lab, all on `office_lan` with `revealSecret: true` (`scenario.json.erb:78`) and no policies block: LW-OPEN-07 `staff_pc_2` (default picker, `access: { people: ["pierce"] }`, line 1893), the hot desk LW-HOT-01 `hot_desk_pc` (default picker, `access: { people: ["hampshire", "lord", "pierce"] }`, line 1937) and LW-DOOR01. The lab captures Hampshire, Lord and Pierce (Pierce's proof is `session: staff_pc_2`, line 1698). Its scope text says Pierce's password "may be used at the hot desk" (line 187). m01 to m10, `lab_social_engineering` and the other test scenarios have no foothold, so no remote screen. The `ca20` scenarios' `networks` keys are phone Wi-Fi lists, not this model.
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

- `remoteScreen`: `"tiles"` shows the PC's own account tiles (by its `loginPicker`) over the network; `"typed"` shows none of the PC's accounts until a password is right, as Network Level Authentication does. Default: decision D1 (recommended `"tiles"`). Never affects the keyboard screen. A headless host shows no PC tiles under either value.
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
| `foundIn` | Required on `password`, not allowed on other kinds: the item whose text holds the password. It names the entry's label, tag ("In file"), toast and found-password line |
| `endsOnGlobal` | `assist_invite` only, optional: a declared global; once true, the invite is over for the game |

At most 64 entries; the server reads the first 64 by sorted id. References are checked by the validator (section 6.3); the schema only closes the entry's shape.

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
| `session: pcId` | The player has ever held a non-relay session at that PC | `signedInPcs` |
| `planted`, `dropped` | As capture proofs today (`capture_proof_holds?`) | `plantedItems`, `gainedFootholds`, `droppedItems` |
| `held: itemId` | An inventory entry whose own stored `credential` equals the credential's id, whose type equals the definition's, whose id equals the definition's id with no name fallback, and that is not `client_forged?`. The definition is found by `CredentialModel.item_definition`, a static walk of the scenario with no session: every sign-in PC's contents and its account profiles' contents, every resource's contents (shares, wherever they are mapped or opened), room objects, container contents, NPC and flag-station `itemsHeld` (flag rewards, `games_controller.rb:2913-2919`), `startItemsInInventory` and declared-grant items (`DeclaredGrants.for`) | `inventory` |
| `foothold: footholdId` | The foothold is held now | `footholds` |

The `held` match is identity-strict: `same_item?`'s name fallback is not used. `held` and `foothold` stop holding when the item leaves the inventory or the foothold is lost, and the entry leaves the keyring. A session already opened is ended by its own route rules (section 3.8), not by that.

A relay sign-in does not add its PC to `signedInPcs` (section 3.8), so a transient invite never satisfies a `session` proof or `account_capture_served?` for good.

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

| Route | Kinds | Check | Session record | Reach from the session |
|---|---|---|---|---|
| `foothold` | `saved_connection` | `host_reachable_through?(foothold, pc)`, not `remote: "blocked"` | `foothold` | as a password session: pivots, shares, `from` source |
| `from: pcId` (K4) | `saved_connection` | source: the player holds a session at `pcId` that carries no `relay`, is not locked (UI slice 6) and whose route is up, and `pcId` is on; target: not `remote: "blocked"`, its network is in `from_reach(network of pcId)`, and it is neither `pcId` nor any PC on the source's own `from` chain | `from` | as a password session |
| `relay` | `assist_invite` | none for reach: the account holder's own vendor relay. The PC must be on; `remote: "blocked"` does not apply | `relay: true` | none |

**The relay invariant.** A relay session is a sink: it is reached only by Connect, and it is never a pivot in the reach walk, never a bridge or down block in the network view, never a share source, maps no shares on its desktop, is never the source of a `from` route, is never offered at the holder's keyboard and is not listed in the network view. Section 3.8 names every reader that enforces it.

### 3.8 The session record and its readers

`sessions[pcId] = { id: npcId, via: "credential", credential: credId, foothold? | from? | relay? }`, one slot per PC, replaced by the next sign-in. A `foothold` or `from` sign-in adds the PC to `signedInPcs`; a relay sign-in does not.

The record is today's held-session record with three added fields; nothing is reshaped. Once UI slice 6 adds `locked`, K-lock (section 8.6) lets it lock a foothold or `from` credential session; a relay session is never locked.

Server readers changed in K2 (and K4 for `from`):
- `session_route_up?`: before the blank-foothold return, a relay session is up while its credential is not in `endedCredentials` and the PC is on; a `from` session is up while the source session exists, carries no `relay`, the source's own `session_route_up?` holds, the source PC is on, and the target network is in the access variant of `from_reach(source network)` (K4, which does not call this method on its pivots). The `from` walk carries a visited set of PC ids and answers false on a repeat, so two sessions that name each other cannot recurse. Otherwise the existing foothold logic. Every scoped reader (`session_admits?`, the profile checks) goes through it.
- `reach_session_hosts` and `view_session_hosts`: skip a session with `relay`, so it is no pivot and never named as a bridge ("via {displayName}") or in a down block.
- Slice 6 also edits the reach walk (`reach_walk` skips locked session hosts; `reach_cache_key` carries the lock state). Whichever lands second keeps both skips in one test on the session (a relay or a locked session is no pivot). K2 checks that `reach_cache_key` needs no change for a relay (the skip makes it no input to the walk); K4 checks that the key changes when a `from` session is added or ended, since that session is a pivot. Slice 6's view marks a locked pivot's bridge label (`via_for`); the relay skip removes a relay session before that mark.
- `resource_admits_player?`: the session loop skips a session with `relay`.
- `implant_foothold!` (`network_access.rb:475-479`): the session-shape branch accepts only a session with a blank foothold, which a relay session also has; it refuses a session carrying `relay` (or `from`), so a plant through a shared screen never grants a foothold.
- `mapped_shares(pc, npc)`: returns `[]` when the session at that PC carries `relay`, so the relay desktop maps nothing and `find_login_item`'s mapped-share search finds nothing through it.
- `prune_unreachable_sessions!`: iterate to a fixed point, so a session whose pivot has become a relay (no longer counted by `reach_session_hosts`) ends with the sessions beyond it; also end a `from` session whose source session is gone, whose source carries `relay`, or whose `from` walk hits a repeat (K4). Outages still never prune; `session_route_up?` refuses while the source is off and allows again when it is back.
- `start_login_session!` and every sign-in that replaces a session already in the slot (a relay replacing a pivot or a `from` source, a typed or claim sign-in replacing a relay, a credential sign-in replacing a password session): the caller runs `prune_unreachable_sessions!` after the write and the login answer carries the ended ids as `endedPcIds`, which the client hands to `linkDropped`, as POST /logout already does.
- `host_row`: offer any session that is neither a claim nor a relay; the held entry's `via` comes from the session, `remote` is true when it has `foothold` or `from`, and a `from` session carries `route: { from: pcId }` so the view opens it by that route.
- `desktop_request_allowed?`, `desktop_refusal` and `render_login_desktop`: all three take a route argument (`{ foothold: } | { from: } | { relay: true } | nil`) in place of the bare foothold. Two new branches run before the keyboard rule, keyed on the request's `relay=1` or `from=` param and checked against the server's own record: the session at that PC must carry that same route field, and `session_route_up?` must hold. A param the record does not carry is refused; it never falls through to the keyboard rule. A request with no route param at a PC whose session carries `relay` is refused (the holder's keyboard never opens the shared session). The existing `foothold` branch (`network_access.rb:1185-1188`, which today checks reach, policy, power and `via == 'claim'` only) also refuses when the record carries `relay` or `from`: those sessions open only by their own param.
- `unlock_session_refusal`: picks `not_responding` when the session carries any remote route field (`foothold`, `from` or `relay`), `off` otherwise.
- `settle_session_at_keyboard!`: runs only for a desktop request with no route param (today its caller's `foothold.nil?` guard would also fire on a `from=` or `relay=1` request; K2 and K4 key it on the route argument instead); it leaves a `via: "credential"` session unchanged, so a saved-connection session opened over a foothold stays remote (and still ends on unplug) when the player later opens it at the target's keyboard.
- `session_for_client` and `login_session_answer`: pass the session's route field (`foothold`, `from` or `relay`), `kind` and `label`, so a credential session is reported as remote with its route after a reload.
- `start_login_session!`: takes `credential:` and the route; skips `signedInPcs` for a relay.
- Reload: `end_claimed_sessions!` uses a new `reload_ended_session_ids` (claims plus relay sessions); `claimed_session_ids` keeps meaning claims only.
- Bootstrap: the bootstrap builds `sessions` (`games_controller.rb:425`) before it ends claims (`:437`); `sessions_for_client` leaves relay sessions out of that answer, since the same request ends them, so a reload never hands the client a relay session the server no longer holds.
- The task check for an `unlock_object` task on a sign-in PC (`game.rb:3733-3736`) reads `signedInPcs`, so a relay sign-in never completes it; the client matches it (below).
- Typed passwords: POST /login with `relay` is refused (a relay is never a typed sign-in).

Client readers (each in the slice named):
- K3a: `systems/screen-states.js:83` paints the sprite locked when the PC is locked and the session's `via` is neither `password` nor `credential`, so a foothold credential session looks like a password session. K3c: a session with `relay` paints locked too (the person's screen is shared, not unlocked at the desk).
- K3c: `pc-sessions.js` keeps a relay PC out of its `signedIn` set (the mirror of `signedInPcs`, `pc-sessions.js:410`), and `load()` (`:178-191`) drops a relay record without a POST /logout; `objectives-manager.js` ignores `pc_signed_in` with `relay: true` (`:332`), as it already ignores an implant foothold (`:340`).
- K3c: a click on the PC in the world goes through `interactLoginPc`, which opens the desktop whenever `pcSessions.has(pcId)` (`unlock-system.js:482`); the keyboard screen also reads the session for `current` and `onComplete` (`:618`, `:624`). All three, and `openLoginPc` (`unlock-system.js:260`), use one helper, `heldAtKeyboard(pcId)` (a session that is not a relay). On the server, in K2 (its tests need it), the claim guards that refuse while a session is held (`game.rb:2227`, `:2296`) and the typed `attempt_login!` treat a relay session as not held: a claim or sign-in at the holder's keyboard replaces it in the one slot, as any later sign-in does. So a click at the holder's keyboard opens the sign-in screen by the desk rules.
- The mirror's shape (`pc-sessions.js`). A foothold credential session is as a remote password session: `remote: true`, `footholdId`. A relay session (K3c) carries `relay: true`, `remote: false` and no `footholdId`, so the capture log's Sessions section (`capture-log-model.js:94-110`, which lists only `remote === true`) leaves it out and `isNetworkScreenContainer` (`container-minigame.js:55-62`) is false, so its desktop closes to the world, not to the network screens. A `from` session (K4) carries `remote: true` and `fromPcId`, no `footholdId`: the capture log lists it at the end of Sessions as "Remote session from {host}"; `networkLinks.openSession` (`network-links.js:694-708`) opens it with `from=` when it has `fromPcId` (today it opens only with a `footholdId` and otherwise toasts); `isNetworkScreenContainer`'s last test (`remote === true`) also requires `footholdId`, so a `from` desktop closes to its `returnTo` desktop, and `networkScreenKind` (`:105-113`) answers as for a desktop with no trip.
- The others already test for `claim` (`pc-sessions.js`, `container-minigame.js`, `network-links.js`, `network-view-minigame.js`, `workstation-state.js`, `unlock-system.js`). K2's build log lists a fresh grep for `via` and `foothold` on the client.

## 4. What every slice must keep

- **GET /capture_secrets answers stay identical.** No slice edits `capture_secrets_for_client`, `account_capture_usernames` or `account_capture_served?`. K1 adds a golden test of the answer for every fixture game in `test/fixtures/files/access_leak/responses.jsonl` and the test scenarios with captures.
- **Shipped scenarios.** K0 changes the remote screens of the two networks scenarios (section 9.2), `lab_physical_pentest` among them, so K0 merges only after D1 is picked. From K1 on, every new screen element appears only in a scenario that declares `credentials`.
- **No format step** (section 12).
- **Pixel-art rule and UI language:** 2px borders or the theme skin, pixel fonts only, authored headshots for every account, X closes, one look per concept, the frame wraps all content at 1400x1000, 390x844, 915x412 and 800x600, scrollers keep the frame whole with the pixel scrollbar and a "More below" cue.
- **One phrasing per state.** On a remote screen, the tray and the view, the off, unreachable and remote-off states use one helper each (section 8.5). The keyboard screen keeps "This PC ..." for the PC in front of the player.
- **Sync size:** each slice states what it stores and what each request sends.
- **Process:** commit before testing, explicit paths, no attribution lines; new static imports in engine JS go on each JS test harness copy list.
- **Live proof:** a keyless server on the builder's own port, a headless browser through the real routes, shots at the four sizes with scrollbars shown, `tools/playtest/verify-run.rb` showing progress on the server, and tampered-client checks sent with `fetch` from the page.

## 5. Slice K0: phase 0, the target's own tiles over the network

Base: main. Size: M. Merges after D1 is picked (the picks page sits between K0's live proof and its merge).

### 5.1 Server

- `scenario-schema.json`: policy `remoteScreen` (`enum: ["tiles", "typed"]`).
- `Game#remote_screen(pc)` (`network_access.rb`, beside `remote_blocked?`): the policy's value, else `DEFAULT_REMOTE_SCREEN` (D1).
- `GamesController#login_accounts` with `foothold` takes a new branch, `Game#remote_login_accounts(info, foothold)`:
  1. A `foothold` that is not an id string of at most 64 characters: 400 (it never falls through to the keyboard branch).
  2. Not held or not reaching the host: 403 `PC not reachable`.
  3. `remote_blocked?`: 422 `{ remoteBlocked: true }`.
  4. `host_service_off?`: 403 `{ reason: "not_responding" }`.
  5. Answer `{ pc_id, host, headless, loginPicker, remoteScreen, loginAccounts }`: `headless` from `NetworkModel.headless?`; `loginPicker` the PC's value or `"accounts"`; `loginAccounts` is `login_account_tiles(pc)` under `tiles` (`known` reads `encounteredNPCs`), `[]` under `typed` and for a headless host (200, never 403). Never `postitNote`.
  Without `foothold` the action is unchanged (a headless host stays 403 at the keyboard); `Cache-Control: no-store` stays.

### 5.2 Client

- `api-client.js`: `loginAccounts(pcId, { foothold } = {})`.
- `unlock-system.js` `openRemoteSignInScreen`: fetch `/login_accounts?foothold=` and `/capture_secrets` together, under one 3 s cap for the pair (`REMOTE_CAPTURES_WAIT_MS`). Until both answer or the cap passes, the screen shows "Checking..." with no form and no focus. If both answer in time, `scene.setRemoteAccounts({ picker, headless, tiles, captured, remoteScreen })` lays it out once, reading `picker` and `headless` from the answer only, never from the lockable. After the cap, the form shows with Other user and a "Still checking for accounts..." line; each late answer redraws the row in place, without moving focus or clearing typed text. A 403 or 422 closes the screen with the shared remote strings of section 8.5; the view already hides sign-in on a blocked row and an off host, so this covers only a race. Switch user on a remote desktop goes through the same fetch, so it gets the same fields.
- `minigames/password/password-minigame.js`: one tile row, and one look for a captured account on every remote screen: the account's tile with a "Captured" tag under the name, which fills the password when served. A captured account is matched to a PC tile by `username`. Each tile carries `data-username`. The "Captured sign-ins" heading and its three heading lines go.
  - Under `tiles` with picker `accounts`: the PC's accounts, a listed captured account tagged, then Other user. Captured accounts the PC does not list are left out (the PC does not admit them; Other user still lets the player type any name).
  - Under `tiles` with picker `known` or `false`: the PC's tiles (if any), then captured accounts the PC does not list, tagged, then Other user.
  - Under `typed`: the captured tiles, tagged, then Other user.
  - A headless host: the captured tiles, tagged, then Other user. No NLA line: it is a device's web sign-in, not a PC with that control.
  - Lines, one string per state, each at most two lines in GNF 16px at 390x844 (about 32 characters a line: GNF advances about 9.4px a glyph in the 306px box), in the message line under the form (section 8.5 has the table): loading "Checking..."; late "Still checking for accounts..."; a `tiles` screen with no captures, none; `typed`, "{host} lists no accounts until you sign in (NLA)."; a headless host, "{host} lists no accounts of its own."; `/login_accounts` failed, "{host}'s accounts could not be loaded."; `/capture_secrets` failed, "Your captured sign-ins could not be loaded."; both failed (and, from K3a, any two lists), "{host}'s sign-in details could not be loaded." The host is the answer's `host`, never "This PC"; when `/login_accounts` has failed, the view row's `host` on the lockable. The state line takes the place of "Choose an account.", stays until a refusal replaces it, and comes back on Change.
  - **Remote error lines.** On every remote screen (not only in scenarios with `credentials`), `signInErrorMessage` and `signInRefusalMessage` use the shared remote strings of 8.5: `notRespondingMessage(host)`, `unreachableMessage(host)`, the remote-off sentence for a `remoteBlocked` answer in place of the server's `REMOTE_BLOCKED` text, and host-named lines for not permitted ("That account can't sign in on {host}.") and lockout ("{host} has locked this account."), which need no name, so they also serve a name typed under Other user. The keyboard keeps its own "This PC ..." lines, including "This PC's sign-in details could not be loaded." when two or more of its lists fail (from K3a).
  - Tags: Press Start 2P at its 8px grid size, one line each, at most two per tile; with three or more, the first tag and then "+N" in place of the second ("Captured" / "+2"), since "Captured +1" (88px) does not fit a compact tile's 76px; text that does not fit is cut with an ellipsis, the full kind name in the tile's title and on the chosen line. Every phase 1 tag fits a compact tile whole (section 8.5).
  - Short window (915x412, where the username line is hidden): tags become one 12x12 CSS px corner badge (an 8x8 pixel glyph inside a 2px border), one glyph per group: a key for a password kind, a plug for a connecting kind; tested at DPR 3. The glyphs are new art, hand-drawn at 8x8 under the pixel-art rule: `assets/icons/badge-key.png` (K0) and `assets/icons/badge-plug.png` (K3a).
  - **Fit.** The layouts come from `pcMonitorMetrics`: at 1400x1000 the 560x350 base drawn at x2; at x1, 342x546 (390x844), 488x306 (915x412) and 720x450 (800x600). Before an account is chosen (the form is hidden until then), the tile row's box is sized from the height left after the header lines and the message line, at least one row of tiles; extra tiles scroll inside the box with the pixel scrollbar and a "More below" cue. Once an account is chosen, the tile row folds at every size on a remote screen (today only at x2 and in the short window, `password-minigame.css:1274-1282`; the fold rule at `:1045` is shared with the keyboard screen, so every new rule here is scoped to the remote screen's own class and the keyboard screen of every mission is unchanged in K0). The message line stays hidden while empty (`password-minigame.css:893-895`) and takes a second line only when its text needs one. Height in the chosen state on a remote screen at x2 also comes from 4px gaps, as the short window already uses (`password-minigame.css:1286-1288`); at 915x412, from 2px vertical padding on the chosen slab. On a remote screen with a held session (Switch user), the "Signed in now" line and the remote line become one slab, "{displayName} signed in, through {link}" (one line at x2, two at 390x844), and the "Username:" and "Password:" label slabs are dropped at x2 and in the short window (the fields keep their placeholders and `aria-label`). Measured on a calibrated replica, Switch user with Other user chosen and a one-line message is 383px of 350 at x2 and 322px of 306 at 915x412 without these, and the plain Other user form with a two-line refusal is 363px of 350 at x2; the merge and the dropped labels must win back at least 35px at x2 and 20px at 915x412, and K0's build log records the measured heights. The Password field, Sign in and the message line never scroll. With these, every K0 fixture below fits `.pc-monitor-area` at all four sizes (today the Other user form with one refusal line overflows by 14px at 1400x1000).
  - **Fit check in a real browser.** jsdom has no layout (`pc-monitor-frame.test.mjs` stubs `getBoundingClientRect`, `scrollHeight` and `clientHeight`), so fit is checked by `tools/playtest/signin-fit.mjs` (new): it loads each fixture screen with the real CSS and pixel fonts in the headless browser the live proofs use, at the four sizes, and fails when `.pc-monitor-area`'s `scrollHeight` exceeds its `clientHeight`, when a line with fixed words has `scrollWidth` above its box, when a line has more lines than its limit (its height divided by its computed line height, measured in its real box with any scrollbar shown, since a wrapped line has no horizontal overflow), when Password and Sign in are outside the visible area, or (from K3a) when the first credential button is outside it. K0's fixtures: the Other user form with the longest real refusal at each size (one line at x2 and 800x600, two at 390x844 and 915x412); Switch user on a remote desktop with a held session, Other user chosen and a one-line message (P6's refusal, and HB-DOOR-01's headless line); the typed screen with its line, each K0 line with the longest sign-in host in each scenario (LW-OPEN-07 in the lab; HB-KIOSK-01 and WS-BENCH-01 in `test_access_networks`), and a row of tagged tiles, one of them with three tags. Its output goes in the build log.
  - The chosen line, Change and the fold rules are the keyboard's.
- Keyboard screens are unchanged: they show no captures. From K3a, in a scenario that declares `credentials`, keyboard screens show password entries with their tags; the README says so.
- `pc-sessions.js` `screenShown(pcId, tiles, ...)` gets the PC tiles shown.

### 5.3 Validator and docs

- `remoteScreen` on a policy whose `remote` is `blocked`: warning.
- `remoteScreen: "tiles"` on a policy used only by PCs with `loginPicker: false` or headless PCs: info line.
- `README_scenario_design.md`, networks section: a host row still names no accounts, but the remote sign-in screen now shows the PC's tiles under `remoteScreen: "tiles"`; document the field, the headless rule, the captured tag and the keyboard rule above.

### 5.4 Tests

- Rails `test/controllers/break_escape/network_remote_tiles_test.rb`: steps 1 to 5; `headless` and `loginPicker` in the answer (default `"accounts"`); `known` over the network; `typed` gives `[]`; a headless host over a reaching foothold gives 200 with `headless: true` and `[]`; no `postitNote` through a foothold even when the owner writes it down; the keyboard answer byte-identical to the base.
- JS `test/js/password-signin-mode.test.mjs`: one row; the Captured tag; a 32-character label cut with an ellipsis; the short-window badge per group; under picker `accounts` no unlisted captured tile; under `known` the unlisted captured tile; a headless answer gives the headless line and an NLA answer the NLA line, whatever the lockable says; matching by `username` with no duplicate tile; no second Other user; every line of 5.2 in its state, including both lists failing; the pair cap and the in-place late redraw keeping focus and typed text. `test/js/access-remote-signin.test.mjs`: "no /login_accounts request" becomes "one with the foothold, and never a post-it"; Switch user on a remote desktop sends the foothold too. `test/js/pc-monitor-frame.test.mjs` (structure only): the row and the tile box's scroller present with seven tiles. `tools/playtest/signin-fit.mjs`: K0's fixtures of 5.2 at the four sizes.
- Scenario `test_access_networks`:
  - Add policy `"nla": { "remote": "allowed", "remoteScreen": "typed" }`.
  - Add two PCs to `desk_room` on `office_lan`, picker `accounts`: `it_pc` (`HB-IT-01`, `access: { roles: ["it"] }`, default policy, so Ian's captured tile shows as his tagged PC tile) and `ops_pc` (`HB-OPS-02`, `access: { roles: ["staff"] }`, policy `nla`). Positions clear of Sam's desk and the dock, checked in a render.
  - `p3_see`'s condition becomes the six-host list `'door_box,it_pc,kiosk_pc,lena_pc,ops_pc,sam_pc'`.
  - The capture card at `scenario.json.erb:295` reads "Her tile is then tagged Captured on a remote sign-in screen." in place of the "Captured sign-ins" sentence.
  - PLAYTEST.md: P3 "all six hosts"; Run 0 step 5's host list (six, in order); the expected validator output (identity reach and "Reachable without a foothold" gain the two desk-room PCs); the captured-tile selector becomes `.signin-tile[data-username="lfox"] .signin-tag`; the harness note becomes "on a tiles screen, `clickText('Other user')` before typing into field 0"; P5, P6 (the remote screen now lists the PC's tiles), P8, N14 (`bench_pc` gains its PC tiles over the network) and the P3 script updated.
  - New beats: P5b (in Run B, where Sam's PC has not been opened at the keyboard: Sam's PC over the network lists Sam, Lena and Ian, as every account holder has the `staff` role; untagged before the lobby capture cards, Lena and Ian tagged after), P5c (HB-IT-01 after Ian's card: one tagged Ian tile, no duplicate), P5d (HB-OPS-02: typed, the NLA line, captured tiles only).
- `lab_physical_pentest/PLAYTEST.md:1028, 1033`: the **Captured sign-ins** wording becomes the tagged tiles under D1's lab answer.

### 5.5 Live proof

New games of `test_access_networks`: plant the drop box; Sam's PC from the view (tiles, headshots, Other user), before and after the cards; HB-OPS-02 (typed, the NLA line); read Ian's card, open HB-IT-01 (tagged tile, no duplicate); HB-DOOR-01 from the view (the headless line, signs in as P8 does today); Switch user on a remote desktop of HB-DOOR-01 (the headless line again); P3 completes on six hosts. Re-run P5, P6, P8 and N14. On `lab_physical_pentest`, with the drop box planted and all three captures read: LW-OPEN-07, the hot desk and LW-DOOR01 from the view, on main today and under each D1 lab answer. Shots at the four sizes, including the loading state with `/login_accounts` held back by a route delay, the late redraw after the cap, and the Other user form with a refusal line at 1400x1000 (no scroller). Tampered client: a foothold not held (403), a malformed one (400).

### 5.6 Sync size

Nothing stored. One extra GET per remote screen open: at most one tile per admitted account, about 150 bytes each.

### 5.7 Cheat analysis

The tiles name accounts admitted at a PC the player reaches through a foothold the server holds: the enumeration a real exposed screen allows, which the policy can turn off. No password, note or capture state is in the answer; POST /login still checks every password.

## 6. Slice K1: the registry, proofs and keyring (server and validator)

Base: main after K0. Size: M. No sign-in behaviour changes.

### 6.1 Files and functions

- `lib/break_escape/credential_model.rb` (new): section 3.6, plus `registry(scenario)`, `accepts(policy)`, `pcs_accepting(scenario, id)`, `end_globals(scenario)` (`{ global => [credId] }`), `item_definition(scenario, itemId)` (the scope of section 3.5's `held` row, declared grants included).
- `app/models/break_escape/credential_keyring.rb` (new concern in `Game`):
  - `credential_proof_holds?(credential)`: `session`, `planted`, `dropped` through `capture_proof_holds?`; `held` and `foothold` as section 3.5.
  - `keyring_entries(pc: nil, route: nil)`: implicit password entries built by calling `account_capture_usernames` and `capture_secrets_for_client`, plus registry entries of built kinds whose proof holds.
  - `keyring_for_client(...)`: section 6.2.
- `lib/break_escape/item_identity.rb`: `credential` in `FORGEABLE_ITEM_FIELDS`.
- `scenario-schema.json`: top-level `credentials` (closed entry, field types and patterns only), policy `accepts` (unique strings), item `credential` (string). Cross-references are enforced only by `check_credentials`.
- `Game#filtered_scenario_for_bootstrap` (`game.rb:1280`): `filtered.delete('credentials')`.
- `tools/playtest/lib/access_leak_scanner.rb`: flag any response with a `credentials` key, a keyring entry whose proof does not hold in the recorded state, or a registry password entry carrying `password`.
- `scripts/validate_scenario.rb`: `credentials` in `known_top_level`, `credential` in `known_item_fields`, new `check_credentials` (6.3).
- Dungeon graph: edges proof source (item, PC, foothold) to a credential node, and credential node to each PC that accepts it.
- `README_scenario_design.md`: a credentials section (registry, kinds, proofs, policy `accepts`, item `credential`, the item type rule, where a credential item may be placed, the ink gift path for an invite, the relay invariant); and correct line 2753: a reload resumes a timer from its saved running time, it does not restart it.
- `docs/IDEAS_BACKLOG.md`: the connection icon; the later kinds (RFID card as a credential, one-time code, key file); an optional per-entry teaching line for scenario-specific wording.

### 6.2 GET /keyring

`GET /games/:id/keyring?pc_id=&foothold=&from=&relay=&rev=`, `no-store`, a read with no side effects. The `keyring` action joins the `before_action :set_game` `only:` list in `games_controller.rb` and stays off the `with_game_lock` list; it gets a route beside `capture_secrets` in `config/routes.rb` and a `GamePolicy#keyring?` with the same rule as `capture_secrets?`, and `keyring_route_test.rb` checks that another player's game answers as GET /capture_secrets does.

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
  - `routes`: held footholds that reach `connectsTo` now (by seq), then (K4) sessions it can be reached from (never a relay session), then `{ relay: true }` for relay kinds. Empty when nothing reaches it. Power and `remote: "blocked"` are not judged here; they are separate fields.
  - `sessionHeld`: the server holds a session at `connectsTo` opened with this credential.
  - `targetOff`: the target's service is off, sent only when `routes` is non-empty (power is told only where the PC could be reached, as `desktop_refusal` does, `network_access.rb:896-899`). `remoteBlocked`: its policy blocks remote sign-in (always false for a relay kind).
- `foothold`, `from` and `relay` name the screen the client is drawing, so the server can decide whether `pc_id` is a screen the player can open; they never assert reach. `routes`, `sessionHeld` and every other field are computed from server-held footholds and sessions only.
- With `pc_id`: `forThisPc` (a password entry, or `connectsTo` is this PC) and `accepted` (the PC's policy takes the kind). Admission is not pre-judged; the sign-in answers it, as for typed passwords. A `pc_id` the player cannot open a screen for (by keyboard, or the named route) is ignored.
- `ended`: an `assist_invite` in `endedCredentials` whose proof still holds is listed with `ended: true` and no routes, so the client can say why it no longer works.
- `rev`: a short digest of the answer; a request whose `rev` matches gets `{ rev, unchanged: true }`.
- Values of non-password kinds never exist in any answer.

### 6.3 Validator checks (`check_credentials`)

Errors:
- unknown kind; a kind not built yet ("not supported until phase 2/3"); `accepts` naming an unknown kind;
- `account` not an account holder; `connectsTo` not a sign-in PC, missing on a connecting kind, or present on `password`; `connectsTo` a headless PC for `assist_invite` (no screen to share);
- `proof` not exactly one known kind; `session` naming no sign-in PC; `held` naming no item in `item_definition`'s scope; `foothold` naming no foothold id any jack, access point or implant action can create;
- a proof that can never hold: a `held` item that is not takeable and is in no declared grant, NPC `itemsHeld` or start inventory; a `session` PC no account is admitted at and no claim opens; a `planted` or `dropped` proof `CaptureModel` already finds unreachable;
- an item with `credential` whose type is `notes`-family or always-allowed;
- a registry `password` without `foundIn`, or `foundIn` on another kind;
- an item `credential` naming no registry id; `endsOnGlobal` naming an undeclared global;
- more than 64 entries; an id outside the pattern.

Warnings:
- a credential no machine accepts: no sign-in PC whose policy accepts the kind, admits the account and is `connectsTo`;
- a `connectsTo` PC whose access list does not admit the account;
- a `saved_connection` whose `connectsTo` no foothold, access point or (K4) linked sign-in PC can reach;
- a `held` item without the matching `credential`, or an item `credential` whose entry's proof is not `held` on that item;
- a `held` item for an `assist_invite` given by a declared grant (claimable at once; use the NPC's `itemsHeld` and the ink gift);
- a `held` item for a `saved_connection` placed only by a declared grant (a tampered client can claim it at once, and a saved connection opens an account without its password; place it in a room, on a desktop or in a share);
- a `session` proof on an `assist_invite`'s own `connectsTo` (a relay sign-in never satisfies it);
- a `foundIn` item whose text does not contain the account's password (a substring check, never quoted; stays a warning), or that is not inside the proof's session PC (its contents, mapped shares or profiles);
- `accepts` without `password`; `accepts` on a policy no PC uses;
- an `unlock_object` task whose target is an `assist_invite`'s `connectsTo` (a relay sign-in never completes it);
- a `saved_connection` whose `connectsTo` policy sets `maxAttempts` (info line: a lockout there refuses the connection for the rest of the game, so it must not be the only route to an item the mission needs).

### 6.4 Tests

- `test/unit/credential_model_test.rb`: kinds, default accepts, proof kinds (exactly one key), registry cap and order, `end_globals`, `item_definition` from `itemsHeld`, from a declared grant, from a share's contents and from a flag-station reward, all with no session.
- `test/models/break_escape/credential_keyring_test.rb`: each proof holds and stops holding, `session: lena_pc` included (a sign-in written through `start_login_session!`); a credential item delivered by a declared grant proves `held`; an always-allowed notepad posted with the .rdp's id, name and `credential` does not prove `held`; a `text_file` with the .rdp's name but another id does not (no name fallback); a room add with that id does not; implicit entries equal GET /capture_secrets; registry password entries never carry `password`.
- `test/controllers/break_escape/keyring_route_test.rb`: answers, `rev` and `unchanged`, routes, `sessionHeld`, `targetOff`, `remoteBlocked`, `forThisPc` and `accepted`, `ended`, an unreachable `pc_id` ignored.
- `test/controllers/break_escape/capture_secrets_unchanged_test.rb`: the golden check.
- `test/controllers/break_escape/sync_payload_size_test.rb`: bootstrap without `credentials`; GET /keyring at 64 entries under 16 KB.
- `test/js/validator-credentials.test.mjs`: one fixture per error and warning, through the real validator, including a grant-placed saved connection (warning), a share-placed one (valid) and a `session` proof on an invite's own PC (warning).
- Scenario `test_access_keyring` (section 9.1), created here with no validator errors and the expected warnings listed in its PLAYTEST.md (`ops_rdp`: no machine accepts it, by design), with its dungeon graph.

### 6.5 Live proof

GET /keyring from the page on a new game of `test_access_keyring`, before and after each proof an honest K1 game can reach: sign in at Sam's PC by its sticky note and take HB-FIN-02.rdp (`held`), read Ian's card and plant the drop box (Ian's implicit captured entry). The `session: lena_pc` proof is shown by the model test in K1 and live in K2, after the .rdp sign-in from the page. The bootstrap has no `credentials` key; the notepad forgery from the page leaves the keyring unchanged.

### 6.6 Sync size

Nothing stored. GET /keyring is a read: at most 64 registry entries plus one per captured account, about 300 bytes each; a repeat with `rev` is a few bytes.

### 6.7 Cheat analysis

The registry never reaches the browser. Every proof reads server-written state. `held` matches the scenario item by type and id, reads the stored item's own `credential`, and that field can only come from the server, so neither a room add nor an always-allowed item with a chosen id and fields proves it. No value of a non-password kind exists. A password value is served only where GET /capture_secrets already serves it.

## 7. Slice K2: the POST /login credential branch (server)

Base: main after K1. Size: M. Nothing in the client calls it yet.

`POST /login { pc_id, credential, foothold? | from? | relay? }` goes to `Game#attempt_credential_login!`. Dispatch (`games_controller.rb:1329-1342`) keeps `claim` first: a body with both `claim` and `credential` gets the claim branch's generic refusal; then a body with `credential` and also `username` or `password` gets the generic refusal, uncounted; then `credential` alone goes to the new branch; then the typed branch. In order:

1. The PC exists (404 as today).
2. `credential` matches the id pattern, names a registry entry of a built connecting kind, and its proof holds. Otherwise the generic refusal `{ success: false, message: "Incorrect username or password" }` (the typed refusal's shape without `attemptsLeft`, since nothing is counted), the same body for an undeclared id, a declared but unproven id, an implicit or registry `password` id (passwords are typed) and a malformed id. Nothing is counted.
3. `connectsTo` is this PC, else 422 `{ message: "This connection is for another PC", wrongPc: true }`.
4. The route is one the kind allows (section 3.7), else the generic refusal; no route at all (the keyboard) is the generic refusal too; a `from` whose source session carries `relay` is the generic refusal. Then the route is judged as POST /login judges a foothold today: 403 unreachable, 403 not_responding (off, for every route), 422 `remoteBlocked` (`foothold` and `from` only; the relay is the holder's own tool).
5. The policy accepts the kind, else 422 `{ kindRefused: "<kind>" }`.
6. The access list admits the account, else 422 `LOGIN_NOT_PERMITTED`.
7. A kind with `honours_lockout` is refused while the account is locked out at this PC (`account_locked_out_at?`, `game.rb:2257`), with `LOGIN_LOCKED_OUT` and `lockedOut: true`, the field the typed lockout answer already uses.
8. An `assist_invite` in `endedCredentials`: 422 `{ ended: true }`.
9. `start_login_session!(pc, npc, 'credential', credential:, route)` writes section 3.8's record; if it replaced a session, prune runs (3.8); the answer is `login_session_answer` plus `{ kind, label, route }` and, when prune ended any, `endedPcIds`.

Steps 3 and 5 to 8 answer only for a held, proven credential, so the browser cannot probe the registry. The client turns each answer into the text of section 8.5.

The typed branch (`username` and `password`) refuses a body carrying `relay` with the generic refusal, uncounted.

### 7.1 Ending an invite

- `credentialEndGlobals`, the bounded map `CredentialModel.end_globals` (at most 64 entries), is written by a new bootstrap writer `record_credential_end_globals!` in `run_bootstrap_writers!` (`prepare_bootstrap_state!`, where `scenario_data` is loaded). `bootstrap_state_needs_write?` gains a term `credential_end_globals_stale?`: true when the scenario declares any `endsOnGlobal` and the stored map is missing or its digest differs from the scenario's. Without that term the writer would never run on a game with no other bootstrap work. The writer then runs the end check below once, so a global that turned true before the cache existed is caught on the next bootstrap. A scenario with no `endsOnGlobal` never writes the key.
- In the sync merge, after globals are applied, the server checks only that cached map: for each listed global now true, it adds the credential ids to `player_state['endedCredentials']` (grow-only, at most 64) and deletes relay sessions whose `credential` is one of them. A relay session is never a pivot or a `from` source, so no session chains off it and ending it needs no prune. No scenario load on sync. If the cache is missing (a sync before any bootstrap), the merge does nothing for credentials; the global stays true and the next bootstrap ends the invite.
- The sync answer carries `endedRelayPcIds`, the PCs whose relay session this merge ended, only when non-empty (at most 64; each credential ends once per game, since `endedCredentials` is grow-only, so each (PC, credential) pair is sent at most once; the client applies it idempotently).
- A client that clears the global later cannot revive the invite. A client that never lets the NPC end it keeps the invite, which honest play can also reach for a while (the timer of 9.1 is client-run).
- On reload the relay session ends (`reload_ended_session_ids`), but the invite is still held and not ended, so Connect works again until the NPC ends it.
- Both keys go in `ACCESS_STATE_DEFAULTS`, are written only by the server and are never read from a client body or sent to the client.

### 7.2 Other server changes

Section 3.8's server readers (`session_route_up?`, `reach_session_hosts`, `resource_admits_player?`, `mapped_shares`, `host_row`, `desktop_request_allowed?` with `desktop_refusal` and `render_login_desktop` threading the route and refusing a no-route request at a relay session, `unlock_session_refusal`, `settle_session_at_keyboard!`, `session_for_client`, reload); `start_login_session!` takes the credential fields and skips `signedInPcs` for a relay; `login_session_answer` adds `kind`, `label` and the route; GET /container passes `relay=1` (and in K4 `from=`) through; POST /logout ends a relay session as any other. `start_login_session!` ends a guest session at the PC for every sign-in that is not a claim (`end_guest_session_at!`, `npc_frustration.rb:253`); a relay sign-in keeps that, by the one-screen, one-session rule. An NPC sitting down is handled on the client (`pc-sessions.js` `displaced`, which sends POST /logout); its relay exception is in 8.3, and the server has no counterpart to change. A sign-in that replaces a session prunes and answers `endedPcIds` (3.8).

### 7.3 Tests

- `test/controllers/break_escape/credential_login_test.rb`: each step's refusal; the generic body byte-identical across undeclared, unproven, password and malformed ids; nothing counted; no route (the keyboard) refused; a relay param on a saved connection refused; `relay` on the typed branch refused, uncounted; a lockout refuses `saved_connection` (with `lockedOut: true`) but not `assist_invite`; a claim and a typed sign-in at `jake_pc` while the relay is held succeed and replace it; a relay sign-in at a PC whose password session pivots to `server_lan` ends the onward session at `ops_pc` and names it in `endedPcIds`; a body with `credential` and `username` (or `claim`) gets the generic refusal, uncounted; a `foothold=` desktop request at a relay session is refused; GET /keyring sends no `targetOff` when `routes` is empty; relay with no reach succeeds and fails on an off PC; a relay sign-in leaves `signedInPcs` unchanged; the ended invite stays ended after the global is cleared; reload ends a relay session, the bootstrap's `sessions` omits it, and Connect works again; `host_row` lists a foothold credential session with its own `via` and `remote: true`, and never a relay session; `session_for_client` after reload reports a credential session's route.
- `test/models/break_escape/credential_sessions_test.rb`: `session_route_up?` for relay (ended, off) and foothold credential sessions; the relay invariant with Jake's relay open at `jake_pc` on `office_lan`: it does not pivot to `server_lan`, `resource_admits_player?` refuses `finance_share`, `mapped_shares` is empty, and (from K4) a `from: jake_pc` sign-in to `ops_pc` is refused; pruning on unplug as for password sessions; `reload_ended_session_ids` versus `claimed_session_ids`; `desktop_request_allowed?` refuses `relay=1` when the record has no `relay`, refuses a no-route request at a relay session, and never falls to the keyboard rule; GET /container with `relay=1` reaches the relay branch through `render_login_desktop` and `desktop_refusal`; `unlock_session_refusal` answers `not_responding` for an off host under a relay or `from` session; a saved-connection session opened at the target's keyboard keeps its foothold and ends on unplug.
- `test/models/break_escape/bootstrap_writers_test.rb`: a fresh game of a scenario with `endsOnGlobal` and no other bootstrap work writes `credentialEndGlobals`; a scenario without one never does.
- `test/controllers/break_escape/sync_end_globals_test.rb`: the sync merge records an end with no `scenario_data` query (assert the narrow load); the answer carries `endedRelayPcIds` once; a sync before any bootstrap records nothing and the next bootstrap ends the invite.

### 7.4 Live proof

On `test_access_keyring`, from the page: with the drop box planted and the .rdp held, POST /login `{ pc_id: lena_pc, credential: lena_rdp, foothold }` signs in, and GET /keyring then lists `jake_pw_note` (the `session: lena_pc` proof, shown live here). Tampered-client calls: an undeclared id, an unheld .rdp, a notepad posted with the .rdp's id and `credential`, the .rdp at its own keyboard, a relay param on the .rdp, `relay` with a typed password, the .rdp at another PC, the ops .rdp at a policy that refuses it, the relay checks (sign out at HB-DESK-01 and HB-FIN-02, open the relay at Jake's PC from the page, check the drop box view still lists `office_lan` only, a GET /container of `finance_share` is refused, and a no-route or `foothold=` GET /container at `jake_pc` is refused), and, after the end global is set, the global cleared by sync and a retry.

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
| Pivot onward from a relay session: the reach walk, a share, a mapped drive or a `from` sign-in | skipped or refused by each reader of 3.8 |
| Open a desktop with `relay=1` without a relay session, or the relay session from the holder's keyboard | refused by the record check |
| A kind the policy refuses | `kindRefused` |
| Revive an ended invite by clearing its global | `endedCredentials` is grow-only on the server |
| Skip a lockout with a saved connection | refused while locked out |
| Keep a `session` proof from a transient relay | a relay sign-in is not recorded in `signedInPcs` |
| Read a token or hash value | no value exists in any answer |

## 8. Slices K3a, K3b and K3c: the keyring on screen (client)

### 8.1 K3a: the sign-in screen (shared module)

Base: main after K2. Size: M.

Only in a scenario that declares `credentials` (shipped scenarios are unchanged). On the remote screen, and on the keyboard screen for password entries only:

- **One tile per account, never per entry.** Order and inclusion as K0 (section 5.2), with keyring accounts in place of captured ones, matched by username. Tags by kind with K0's tag rules ("+N", ellipsis, badge in the short window): "Captured", "In file", "Saved", "Assist".
- **Only usable kinds show.** A screen shows a tag and a button only for a credential whose kind allows that screen's route: `password` everywhere; `saved_connection` on a `foothold` or (K4) `from` screen. An `assist_invite` never shows on a sign-in screen; it is used by Connect alone (8.2).
- **An "In file" tag waits** until the client has opened that item in this page. The keyring module keeps the set of opened `foundIn` item ids for the page's life. After a reload the tag shows at once and its toast is skipped: an accepted gap, since the server keeps no record of a file being read.
- **Choosing an account** shows its ways in on the chosen line, in this order: one button per usable credential for this PC ("Connect with HB-FIN-02.rdp"), each with its full kind name; for a found password, two lines, "Type the password from" and then the file name alone ("passwords.txt"), so the label has the slab's whole width; the Password field (filled only for a captured password the server served) and Sign in, always shown, since `password` is always accepted. A saved connection refused by this PC's policy shows as a greyed button (`aria-disabled`, not `disabled`) with its refused reason under it; its click signs nothing in and shows the full reason (below).
- **The teaching line** is never drawn on the sign-in screen (the 560x350 base has no room for it at any scale): it shows once per page as a toast after the first successful use of each kind (a reload may show it once more), and in the button's title. A refused reason shows under the greyed button in a short form that fits one line at 390x844 with the longest host in play ("{host}: type the password.", six glyphs shorter than the earlier "{host} needs the password typed.", which measured 302px of 306px with HB-DESK-01, so a 12px scrollbar or slab padding does not wrap it; `signin-fit.mjs` checks the line count); clicking the greyed button puts the full reason, control included, in the message slot, so a phone shows it too.
- **Sign in** with a credential posts `credential` with the screen's route; refusals show in the screen's error line with 8.5's text, except a policy refusal already shown under its greyed button, where the error line stays empty.
- **Remote error lines** are K0's (section 5.2); K3a adds the credential refusals of 8.5 to the same table.
- **Loading:** the remote screen waits for `/login_accounts`, `/capture_secrets` and `/keyring?pc_id=&<route>` together, under K0's 3 s cap and late redraw; the keyboard screen, in a scenario with `credentials`, waits for `/login_accounts` and `/keyring` under the same cap and redraw. A failed `/keyring` shows the screen without keyring entries and the line "Your found sign-ins could not be loaded." ("Saved" is kept for the one kind); two or more failed lists give K0's single combined line.
- **Worst cases to prove, at all four sizes:**
  - the tile row: seven admitted accounts, three with keyring entries (one with two tags and a 32-character file name), in K0's one-row box with its own scroller and "More below" cue;
  - the chosen line: Lena with a captured password, the .rdp and a refused kind, and Jake's found-password line with a 32-character file name. When the chosen state is too tall, only the ways-in list (credential buttons and the found-password lines) scrolls, in its own box with the pixel scrollbar and "More below"; the first credential button is in view without scrolling at all four sizes, and the Password field, Sign in and the message line stay in view;
  - Switch user with a held session, as in R4 and R5b: the merged signed-in slab of 5.2, Jake chosen with the found-password lines, Password, Sign in and a two-line refusal; A button label keeps "Connect with" whole and cuts only the label with an ellipsis; the found-password line's file name stands on its own line and is cut only past the slab's width (about 32 GNF glyphs at 390x844); the full label is in the title and in Examine;
  - the remote .rdp desktop's top bar at 915x412 and 390x844: "Remote session through {link}" above the account bar's two lines, with the frame test asserting the desktop area keeps its first row of icons in view.
- **Desktop:** the account bar keeps "Signed in as Lena Fox (lfox)" and adds a second line, "with the saved connection HB-FIN-02.rdp" (`container-minigame.js`); the bezel keeps the PC name. If UI slice 6's start panel has merged first, the line goes where the panel names the signed-in account; the build log says which. Switch user reuses the session's own route.
- **Screen look:** `systems/screen-states.js:83` as section 3.8.

K3a uses the foothold route only. After K3a, a player with a planted drop box opens HB-FIN-02 from the network view and signs in with the .rdp.

Files: `minigames/password/password-minigame.js`, `css/password-minigame.css`, `systems/unlock-system.js` (the fetches), `api-client.js` (`keyring`, `loginWithCredential`), `systems/keyring.js` (new: the cache, `rev` and the opened `foundIn` set), `systems/screen-states.js`, `minigames/container/container-minigame.js` (account bar line), `systems/pc-sessions.js` (credential sessions).

Tests: `test/js/keyring-signin.test.mjs` (the label cut keeping the fixed words whole; one tile per account, tags by kind, the two-tag limit with "+N", the `foundIn` wait and the reload case, buttons above an always-present Password field, the found-password line, no invite tag or button on a foothold screen of HB-FIN-03, greyed refused credential with its reason in the short window and an empty error line, password-only at the keyboard, error texts including the lockout line and the remote strings, loading, the cap and failure at both screens, nothing new in a scenario without `credentials`); `tools/playtest/signin-fit.mjs` (the four worst cases at all four sizes); `test/js/screen-states.test.mjs` (a password and a credential session show the desktop look, a claim paints locked); harness copy lists for `systems/keyring.js`.

Live proof: beats R2, R4 and R5a of section 9.1 with the drop box planted, and the sign-in screen half of R3 (Jake's tile on HB-FIN-02's Switch user screen untagged before passwords.txt is opened, tagged "In file" after), shots of every state at the four sizes with scrollbars shown, both worst-case fixture screens, `verify-run.rb`.

Sync: nothing stored; one GET /keyring per screen open, usually `unchanged`.

### 8.2 K3b: Connect and the find toasts

Base: main after K3a. Size: M.

- **Connect from the tray.** `inventoryMenuFor` (`systems/inventory-menu.js:87`): a held item with a `saved_connection` credential gets (from K3c, an `assist_invite` too, since only K3c draws the relay desktop) `[Connect, Examine]` (plus Drop here when droppable); with no observations, the click is Connect directly. Connect's menu icon is the item's own tray picture, as Use has. Connect opens only from an uncovered tray, as the existing guard already ensures. While a Connect is running the entry is disabled and further clicks do nothing. Connect first flushes any pending sync, then asks GET /keyring and reads the entry, in this order:
  1. GET /keyring fails: toast "Connect could not reach the game server. Try again.";
  2. the entry is missing: toast "{label} no longer works.", with `{label}` from the tray item's `name` (the entry that would carry it is gone);
  3. `ended`: toast "{displayName} ended the remote assist.";
  4. `targetOff`: toast `notRespondingMessage(host)`;
  5. `sessionHeld`: open its desktop by the session's route;
  6. `remoteBlocked`: toast the remote-off sentence;
  7. no route: toast "{host} can't be reached from here. You need a way onto its network.";
  8. a route (K4's `from` first, then footholds, then, from K3c, relay): POST /login with the credential and that route. On success, hand any `endedPcIds` in the answer to `linkDropped`, open the desktop and show the teaching toast the first time for the kind in this page (a reload may show it once more; accepted, since nothing is stored). On a network failure, the toast of step 1. A race since the GET answers as steps 4, 6 and 7 do: 403 `not_responding` gives `notRespondingMessage(host)`, 403 unreachable gives step 7's line, 422 `remoteBlocked` gives the remote-off sentence. On a refusal: for a saved connection's `kindRefused` or lockout, open the target's remote sign-in screen with the account and credential chosen and the refusal shown as 8.1 says; for `LOGIN_NOT_PERMITTED`, toast "That account can't sign in on {host}."; for an assist invite's `kindRefused` or `ended`, the toast of 8.5. (`wrongPc` cannot occur: Connect always posts to `connectsTo`.)
  Connect starts no network-view trip, so closing the screen or desktop returns to the world, or to the opener given as `returnTo` (K4: the desktop it was started from).
- **Find toasts.** `systems/keyring.js` fetches a baseline after bootstrap, then asks with `rev` after a successful sign-in (once the desktop has opened), an inventory add or removal of an item with `credential`, a plant, implant or Wi-Fi join, and the opening of a `foundIn` item. Registry entries new since the last answer give one toast, worded by use under D4 (c), with names, hosts and labels from the entry:
  - saved connection: "Saved connection found: {label} for {displayName} on {host}.";
  - assist invite (from K3c; before it, an invite gets no toast and no Connect): "{label}: Connect it from your inventory to join {displayName}'s session.";
  - password in a file: "{displayName}'s password is in {label}.";
  - with more than two at once, two then "and N more".
  A find caused by an NPC give (the ink gift) is held until the conversation closes, so it never lands beside the gift's own "Received" toast.
  Captured entries stay silent (the capture has its own notice). A `foundIn` entry waits until the item is opened. Nothing is written to globals or player state. D4 has the wording under its other options.
- **The keyring view** follows D4 (recommended: none in phase 1).
- **Backlog:** the NPC gift toast's emoji (`chat-helpers.js:141`) breaks the pixel-font rule; logged in `docs/IDEAS_BACKLOG.md`.

Files: `systems/inventory-menu.js`, `systems/unlock-system.js`, `systems/keyring.js`, `systems/pc-sessions.js`, `systems/network-links.js` (no trip for Connect; the helpers reused, unchanged).

Tests: `test/js/keyring-client.test.mjs` (baseline at load, `rev` reuse, toast wording per kind and grouping, silence for captures, `foundIn` wait, Connect's outcomes in order including both failures, the 403 and 422 race answers and the no-route text, the missing-entry toast named from the tray item, the find toast held during a conversation, the in-flight guard against a double click, the flush before the GET, direct sign-in and the screen only on a saved connection's policy or lockout refusal, the `LOGIN_NOT_PERMITTED` toast, `returnTo`); the inventory-menu test file (`[Connect, Examine]`, direct Connect without observations, the assist code's tray slot).

Live proof: beats R1, R3 and R5b on new games of `test_access_keyring`, shots at the four sizes, `verify-run.rb`.

Sync: nothing stored; one GET per trigger, usually `unchanged`.

### 8.3 K3c: the relay

Base: main after K3b. Size: M.

- **Relay mode.** The lockable's `remote` is `{ relay: true }` beside today's `{ footholdId }`. Connect on an accepted invite signs in and opens the desktop directly (8.2 step 8). There is no relay sign-in screen: a refusal is a toast where Connect ran.
- **The relay desktop.** The account bar reads "Using {displayName}'s session ({username})", the claim bar's form (`container-minigame.js:956`), with one Disconnect in place of Switch user and Sign out, and no link line; the header reads "Remote assist session" (in slice 6's start panel if it has merged first, as for K3a's line). No share folders show (the server maps none). Where they would be, one line says why: "Shared drives are not mapped over remote assist." It is in 8.5's table and in the relay desktop's fit fixture (`signin-fit.mjs` gains the relay desktop at the four sizes). Disconnect is POST /logout. Request params carry `relay=1`. Readers that branch on `remote`: `openLoginSignIn`, `pc-sessions.js` remote fields, the container's header and params, and the three of section 3.8's mirror-shape bullet (capture log Sessions, `openSession`, `isNetworkScreenContainer`).
- **Events.** `pc-sessions.js` adds `relay: true` and `kind` to `pc_signed_in` and `pc_desktop_opened` for a relay session, so a mapping can tell a relay from a remote foothold session.
- **Re-entry.** An open relay session is reached again only by Connect (8.2 step 5); the network view does not list it. At the holder's own keyboard, `heldAtKeyboard` treats the relay record as no session (section 3.8) and opens the sign-in screen by the desk rules, and the sprite paints locked (section 3.8); the server refuses a no-route desktop request there.
- **Prompt end.** While the client holds a relay session, `systems/keyring.js` calls `stateSync.sync()` on any `global_variable_changed`, so an end global reaches the server within a second or so rather than at the next 30 s sync. The trigger lives only as long as the relay.
- **Ending.** `linkDropped(endedPcIds, reason)` gains a reason (K2's client half, landing with K3a): `unplugged` keeps today's `unplugEndedMessage` (`pc-sessions.js:88-93`) for unplug only; `route_ended` (a prune after a sign-out, a replacing sign-in, a borrow end or `displaced()`) uses the 8.5 line "Your session on {host} ended: the session it went through was closed."; `relay_ended` uses the ended line below. `pc-sessions.js` handles the sync answer's `endedRelayPcIds` with `relay_ended`: the mirror drops the session and an open relay desktop closes with "{displayName} ended the remote assist.". If that sync answer is lost, the next request from the relay desktop gets 403 and `pc-sessions.js`'s existing 403 path drops the session; Connect's GET /keyring then answers `ended`.
- **Displacement.** The holder sitting down at his own PC does not end the relay session (unit test only; the test scenario's Jake never sits).

Files: `systems/unlock-system.js`, `systems/pc-sessions.js`, `systems/screen-states.js`, `systems/keyring.js`, `minigames/container/container-minigame.js`, `state-sync.js` (sync answer handling; harness copy lists if an import is added).

Tests: `test/js/access-remote-signin.test.mjs` (relay headers and params, re-entry by Connect, the holder's keyboard opens the sign-in screen through `interactLoginPc`, the world click path, not only `openLoginPc`); `test/js/keyring-client.test.mjs` (`endedRelayPcIds` closes the desktop with the text; refusal toasts for an invite; a global change during a relay asks for a sync, and none after it ends); `test/js/pc-sessions.test.mjs` (no displacement by the holder; `relay` and `kind` on both events; a relay sign-in leaves `signedIn` unchanged; `load()` with a relay record keeps no session, no `signedIn` entry and no armed sync trigger); the objectives test (a relay `pc_signed_in` completes no `unlock_object` task); `test/js/screen-states.test.mjs` (a relay session paints locked).

Live proof: beats R6 to R9 and R11 on new games of `test_access_keyring`, shots of the relay desktop at the four sizes, `verify-run.rb`.

Sync: nothing stored by the client; `endedRelayPcIds` arrives once per ended invite.

### 8.4 Cheat analysis for K3a to K3c

Display only. Every sign-in goes through section 7's checks; the client never holds a non-password value; a registry password is never sent.

### 8.5 Player-facing text (decision D7)

On-screen text only, not spoken, so it lives in the engine's text table keyed by kind and state. Every line drawn on a sign-in screen fits two lines (a short form, one) of 306px of GNF 16px, the message box at 390x844, with the longest host in play; `signin-fit.mjs` checks each. Every name, host and label is a template field filled from the entry or the PC (`{displayName}`, `{host}`, `{label}`), never free text, and the engine text uses no pronoun for the account holder. The examples use the test scenario's names.

Shared remote strings (one per state, used by the remote sign-in screen, the tray and the view):

| State | Text | Source |
|---|---|---|
| off over the network | "{host} is not responding." (the view's row label stays "Powered down") | `notRespondingMessage`, unchanged |
| unreachable on the view or a remote screen | "{host} can't be reached over this link." | `unreachableMessage`, unchanged |
| unreachable from the tray (no link in play) | "{host} can't be reached from here. You need a way onto its network." | new, Connect only |
| remote blocked (sign-in, K0 race close, Connect) | "Remote sign-in is off on {host}." | new sentence beside `REMOTE_OFF_TEXT` (the view's row label stays "Remote sign-in off") |

Tags (one line, at most 9 glyphs) and full names (title and chosen line):

| Kind | Tag | Full name |
|---|---|---|
| captured password | "Captured" | "Captured password" |
| password in a file | "In file" | "Password in a file" |
| saved_connection | "Saved" | "Saved connection" |
| assist_invite | "Assist" | "Remote assist" (Connect only) |

Lines:

| Key | Text | Alternative for D7 |
|---|---|---|
| password in a file teach | "People save passwords in files. Anyone who reaches the file has the account. Keep passwords in a password manager, not a file." | "A password in a file is a password anyone can read." |
| saved_connection teach | "The password is saved inside this file, so opening it signs you in as {displayName}. A policy that always asks for the password stops it." | "This file remembers {displayName}'s password. Whoever holds it is {displayName}." |
| assist_invite teach | "{displayName} let you into the session. Check who is asking before you share access." | "{displayName} let you in. Nobody checked who was asking." |
| saved_connection refused | "{host} always asks for the password, so a saved one is ignored." | "{host} does not accept saved passwords." |
| assist_invite refused | "{host} does not allow remote assistance." | "Remote assistance is turned off on {host}." |
| locked out (remote screen, typed or credential, and Connect) | "{host} has locked this account." | |
| not permitted (remote screen, typed or credential, and Connect) | "That account can't sign in on {host}." | |
| saved_connection refused, short (under the greyed button) | "{host}: type the password." | |
| wrong PC (a tampered-client answer only: a sign-in screen offers only credentials for its own PC and Connect posts only to `connectsTo`) | "This connection is for another PC." | |
| ended | "{displayName} ended the remote assist." | |
| route ended (`linkDropped` reason `route_ended`; unplug keeps "Unplugged. Your session on {host} ended.") | "Your session on {host} ended: the session it went through was closed." | |
| no longer works | "{label} no longer works." (`{label}` from the tray item's `name`) | |
| keyboard, two or more lists failed | "This PC's sign-in details could not be loaded." | |
| Connect failed | "Connect could not reach the game server. Try again." | |
| keyring failed | "Your found sign-ins could not be loaded." ("Saved" names one kind; the tray's "Key Ring" is the physical keys) | |
| K0 lines | as section 5.2 | |
| found password on the chosen line | "Type the password from" / "{label}" (two lines; the label alone on the second) | |
| find toasts | as 8.2 | under D4 |
| relay desktop bar (under the header "Remote assist session") | "Using {displayName}'s session ({username})", as the claim bar | "{displayName}'s screen, shared with you" |
| relay desktop, no shares | "Shared drives are not mapped over remote assist." | |

### 8.6 K-lock: credential sessions under the session lock

Base: main after both K3c and UI slice 6 (whichever merges second). Size: S. Skipped if slice 6 is dropped.

Slice 6 owns the lock: the `locked` flag and its delta, `session_identity` answering nil for a locked session, the reach walk's skip and its cache key, the view's Locked label, `canLock`, and the unlock through the PC's password check counted against `maxAttempts`. K-lock adds only what slice 6 leaves out for credential sessions:
- Slice 6 refuses a lock with 422 for any session that is not a password sign-in. K-lock widens that rule to a `via: "credential"` session with `foothold` or `from`, which the player opened as the account; the client's `canLock` follows. Such a session unlocks in either of two ways: the account's password, through slice 6's check, or a fresh sign-in with the same credential, which K2's branch already does (`start_login_session!` replaces the record, and the new record carries no `locked`), counted like any credential sign-in (nothing counted; a lockout still refuses a saved connection). Without the second way a player who locks the .rdp session on HB-FIN-02 would be stranded, since the test scenario never gives Lena's password, the case for which slice 6 refuses to lock a claim. GET /keyring reports `sessionHeld: false` for a locked session (`session_identity` answers nil), so Connect takes step 8 and signs in again, and the remote sign-in screen offers the .rdp button as for any foothold screen. A lock on a relay session is still refused: it is the holder's own screen, with Disconnect only.
- Tests: a foothold credential session locks, is treated as signed out while locked (through slice 6's `session_identity`), and unlocks with the account's password, counted; the .rdp signs in again and the new record carries no `locked`; GET /keyring answers `sessionHeld: false` while it is locked; a lock on a relay session answers 422.
- Live proof: lock HB-FIN-02's .rdp session on `test_access_keyring`, then Connect the .rdp from the tray: the desktop reopens unlocked.

## 9. Slice K4: signing in from a desktop

Base: main after K3c. Size: M. Decision D6 says whether it is in phase 1 (recommended: yes).

- Route `from: pcId` (section 3.7) in POST /login, GET /keyring `routes`, `desktop_request_allowed?` (with `desktop_refusal` and `render_login_desktop`), `session_route_up?` and `host_row` (section 3.8). A source session carrying `relay` is never a `from` source, in every one of them.
- `prune_unreachable_sessions!` ends a `from` session whose source session is gone, carries `relay`, or whose walk repeats (3.8); `logout_session!` and `end_claimed_sessions!` already call it. Unplug (`end_sessions_through!`, `network_access.rb:298`) and the end of an NPC borrow (`record_borrow_done!`, `npc_frustration.rb:372`) end sessions without pruning today; K4 has both call it afterwards. Unplug adds the pruned ids to its `endedPcIds`; the `npc_workaround` answer gains `endedPcIds` (only when non-empty), which `systems/npc-workarounds.js` hands to `pcSessions.linkDropped`. `pc-sessions.js` `displaced()` passes its POST /logout answer's `endedPcIds` to `linkDropped`, as `signOut` already does. So a `from` session whose source has gone ends with it on both sides, and GET /keyring never reports a dead `sessionHeld`.
- A `from` sign-in (credential or typed) is refused with the generic refusal when the target is on the source's own `from` chain, so two sessions can never name each other.
- The `from` sign-in screen: GET /login_accounts gains a `from` branch beside K0's `foothold` branch (the checks of 3.7's `from` row, never a post-it), and the typed `attempt_login!` takes a `from:` route recorded on the session, so a typed password on that screen is judged by the route, not the keyboard. `settle_session_at_keyboard!` strips `from` from a password session as it strips `foothold`.
- A `from` source is never the target PC itself.
- **Reach for `from`: `from_reach(network)`.** Not `networks_reachable_from` (`network_access.rb:1129`), which is a plain walk over up links and needs no session on the networks between, so it would let a `from` sign-in out-reach a drop box on the same network. `from_reach` is `reach_walk_uncached` (`network_access.rb:1081-1112`) copied as it is and seeded from the source network instead of a foothold: a link is crossed only from a reached network on which a host in `reach_session_hosts` stands (relay skipped; from slice 6, locked skipped), and, in the access variant, whose service is on. Like that walk it never calls `session_route_up?` on a pivot, so it cannot recurse through another `from` session; the only `from` recursion is the source chain, which the visited set of PC ids bounds. Sign-in, GET /keyring `routes`, GET /login_accounts and desktop checks use the access variant (outages count); `prune_unreachable_sessions!` uses the structural variant (outages ignored), as `structural_reach` does for footholds. Results are cached per request under `reach_cache_key` plus the source network.
- **Scope.** The `from` param is answered only in a scenario that declares `credentials`: elsewhere POST /login (typed or credential), GET /login_accounts, GET /keyring and the desktop requests treat a `from` param as the generic refusal (POST) or 400 (GET), so `lab_physical_pentest` and `test_access_networks` keep today's reach, and a tampered client at the lab's hot desk cannot sign in to LW-DOOR01 without the drop box. 9.2 lists this.
- Client: Connect started from a desktop file uses that desktop as the `from` source; Connect from the tray takes 8.2 step 8's order and, among `from` sources, the most recently opened session; the remote screen header reads "Remote sign-in from HB-DESK-01". On the desktop where the file sits, the file's dialog gains Connect beside its existing actions; Connect there first takes the file (POST /inventory with `source_pc_id`, the desktop take that exists today), since the proof is `held`, then signs in, and `returnTo` is that desktop, so the X on the target's desktop goes back to it. Switch user on a `from` desktop reuses the `from` route; the view's Open on a `from` session opens it with `from=`.
- Tests: `test/controllers/break_escape/credential_from_route_test.rb` (route checks; source logged out ends the session; source PC switched off refuses the desktop and scoped requests, and allows them when it is back; a claimed source ends on reload and the chain with it; no `from` for a relay kind; a relay source refused, as `ops_rdp` with `from: jake_pc` during Jake's relay; a `from` session survives reload and `session_for_client` reports it as remote; plant, sign in to HB-FIN-02 with the .rdp, sign in to SV-OPS-01 with a typed password `from: lena_pc`, unplug: both sessions end and `endedPcIds` names both; GET /login_accounts with `from` answers the target's tiles and refuses a source the player does not hold; the target is never its own source; B `from` A then A `from` B is refused, and a cycle written straight into state is pruned; a borrow that ends a source answers `endedPcIds` and the client closes the onward desktop; a `foothold=` request at a `from` session is refused; a `from` source with `remote: "blocked"` does not block, a target with it does; a keyboard session on `office_lan` with no session on `server_lan` cannot reach a host two links away; a `from` param in a scenario without `credentials` is refused on every route); JS route choice, the desktop Connect, `returnTo`, Switch user and the view's Open.
- Live proof: beat R10, from Sam's keyboard with no drop box, and the relay-source refusal from the page.
- Sync: one route field in the session record.
- Cheat: `from` names a session the server holds and never a relay; reach is `from_reach`, which needs a pivot session on each network crossed, so a `from` sign-in never reaches further than a foothold on the source's network would.

### 9.1 Test scenario `test_access_keyring`

Browser-only, no VM, built in K1 and grown through K4. `social.captures.revealSecret: true`, so a captured password fills when served. Start inventory: the drop box only. Every account holder is a room NPC with a sprite, talk portrait and headshot, with a varied cast.

**Networks:** `office_lan`; `server_lan`, linked from `office_lan`.

**Policies:** `finance` and `pw_only` as section 3.2, and `finance_desk`, `finance` without `maxAttempts`, on Lena's PC, so wrong passwords there never lock `lfox` out of HB-FIN-02 and strand the Finance PIN (lockouts never expire). The saved-connection lockout refusal is proved in K2's unit test. Jake's PC takes `jake_desk`, `{ "remote": "blocked", "accepts": ["password", "assist_invite"] }`: over the network, the invite is the only way onto HB-FIN-03 (the relay ignores `remote: "blocked"`, section 3.7), so R6 shows what an invite is for. His keyboard is out of reach too: HB-FIN-03 stands in Jake's office, whose door stays locked for the whole test (below), so the player who already holds Jake's password from `passwords.txt` (R4) cannot type it there, and the relay is the only way onto that PC. The relay also has a payoff of its own: Jake's desktop holds `vendor_contract.txt`, which the run's last task asks the player to read. The README credentials section says an invite should open something the player cannot otherwise reach from where they are.

**Resources:** `finance_share`, a `file_share` on `server_lan`, `access: { people: ["jake"] }`, holding `q3_payroll.txt`. Honest play maps it from Jake's own sign-in on HB-FIN-02 (R4); the relay never maps it (R6).

**Rooms:**

| Room | Door from | Lock | Holds |
|---|---|---|---|
| Lobby (start) | | none | signs for the beats; Lena Fox standing at reception (away from her desk, so her PC is free); a capture card for Ian (as `test_access_networks`: reading it fires `addCapture`; Ian's proof is `planted: drop box on comms_port`) |
| Office | Lobby, north | none | Sam's PC `sam_pc` (`HB-DESK-01`, `office_lan`, access `{ people: ["sam"] }`, picker `accounts`, sticky note with Sam's password); Sam's desktop holds `HB-FIN-02.rdp` (`lena_rdp_file`, takeable); Sam Okafor standing by the window, never sitting |
| Comms | Office, east | none | jack `comms_port` on `office_lan`; `SV-OPS-01` `ops_pc` in a rack (`server_lan`, policy `pw_only`, access `{ roles: ["it"] }`; its keyboard also works with Ian's captured password, which the beats do not need); Ian Shaw standing |
| Finance | Office, north | PIN; the code is in `door_code.txt` on Lena's desktop, so the room opens only after R2 | Lena's PC `lena_pc` (`HB-FIN-02`, `office_lan`, policy `finance_desk`, access `{ people: ["lena", "jake"] }`, picker `accounts`); her desktop holds `passwords.txt` (`lena_passwords_txt`, not takeable), `door_code.txt` and `SV-OPS-01.rdp` (`ops_rdp_file`, takeable); Jake Brooks standing by the door to his office, never sitting |
| Jake's office | Finance, east | key `jake_office_key`, in Jake's `itemsHeld` and never given, so the room never opens in the test (an expected validator warning, listed in PLAYTEST.md); the door's observations name HB-FIN-03 through the glass | Jake's PC `jake_pc` (`HB-FIN-03`, `office_lan`, policy `jake_desk`, access `{ people: ["jake"] }`, picker `accounts`); its desktop holds `vendor_contract.txt` (not takeable); the task "Read the vendor contract on Jake's PC" completes when that file is opened, with the objective type the build picks from those that exist, named in K1's build log |

**Cast:**

| NPC | Role | Account | Where | How the player gets in |
|---|---|---|---|---|
| Sam Okafor | staff | `sokafor` | Office, standing | sticky note on HB-DESK-01 |
| Lena Fox | finance | `lfox` | Lobby, standing | `lena_rdp` |
| Jake Brooks | finance | `jbrooks` | Finance, standing; an existing walk sheet with a headshot no other cast member here uses, no new art, named in K1's build log | `jake_pw_note` (Switch user on HB-FIN-02), `jake_assist` |
| Ian Shaw | it | `ishaw` | Comms, standing | captured password (card plus drop box), served under `revealSecret` |

**Registry:** `lena_rdp` (saved connection, `held: lena_rdp_file`); `ops_rdp` (saved connection for Ian, `connectsTo: ops_pc`, `held: ops_rdp_file`); `jake_pw_note` (`session: lena_pc`, `foundIn: lena_passwords_txt`); `jake_assist` (`held: jake_assist_code`, `endsOnGlobal: jake_ended_assist`).

**Jake.** `jake_assist_code` (type `text_file`) is in Jake's `itemsHeld`. Posing as the helpdesk, one ink choice gives it with `#give_item:text_file:jake_assist_code`, shown once (gated on a global set by the item's `onPickup`). Two ways end the invite, both setting `jake_ended_assist`:
- the timer: a mapping on Jake for `global_variable_changed:jake_contract_read` with condition `!globalVars.jake_ended_assist`, `onceOnly`, sets `jake_assist_armed`; `jake_contract_read` is set when `vendor_contract.txt` is opened (the mechanism K1's build log names, the same one the last task uses), so the invite cannot end before the one thing only it reaches is read; a top-level `timers` entry with `startOnGlobal: jake_assist_armed`, `delayMs: 90000` (long enough for R6's checks), condition `!globalVars.jake_ended_assist`, `showCountdown: false`, sets `jake_ended_assist` and `jake_timer_ended_assist`. On reload the timer resumes from its saved running time, so the invite still ends about 90 seconds after the contract was read, counting only time in play;
- the ink: a later conversation, offered only once `jake_contract_read` is true, lets him grow suspicious and sets the same global.
The README credentials section adds the rule: an invite that is the only route to something the mission needs must not end before that thing is reached; the validator cannot check it, so the picks page shows this stranding case beside the timer evidence (HB-FIN-03 with no route once the invite ends: remote blocked, office locked, `endedCredentials` grow-only, code given once).
The bark is on a Jake mapping for `global_variable_changed:jake_timer_ended_assist` (so the ink ending, which has its own lines, gets no bark), in his NPC JSON, in the past tense: "I've ended that session. The helpdesk never calls me back." It waits behind the relay desktop, which the prompt sync of K3c closes within a second or so, so the player reads the end line, then hears Jake.

**Earned secrets:**

| Secret | Where | Unlocks |
|---|---|---|
| Sam's password | sticky note on HB-DESK-01 | Sam's desktop (R1, R10 source) |
| HB-FIN-02.rdp | Sam's desktop | Lena's PC over the drop box (R2) |
| Finance PIN | `door_code.txt` on Lena's desktop | Finance room (R6) |
| SV-OPS-01.rdp | Lena's desktop | refused by `pw_only` (R5a) |
| Jake's password | `passwords.txt` on Lena's desktop | Switch user to Jake on HB-FIN-02 (R4) |
| Ian's password | capture card plus drop box, served under `revealSecret` | SV-OPS-01 over the network (R5a) |
| Jake's assist code | Jake's ink | HB-FIN-03 by relay (R6) |
| Vendor contract | Jake's desktop, reached only by the relay | the last task (R6) |

**Runs.** Run A is R1, R2, R3, R5a, R5b, R4, R6, R7a and R7b in that order, on one game, then R11. Run B starts a new game, plays R1, R2 and R3, opens Finance and gets the code, then Connects without signing out of HB-FIN-02, opens the contract and reloads with the relay desktop open (R8). Run C plays R1 and R2 and unplugs (R9). Run D (K4) starts a new game and never plants the drop box (R10).

| Beat | What it proves | Slice |
|---|---|---|
| R1 | At Sam's keyboard (sticky note), take HB-FIN-02.rdp; toast "Saved connection found"; sign out at HB-DESK-01, so the only pivot later is Lena's session | K1, K3b |
| R2 | Plant the drop box; HB-FIN-02 from the network view; Lena's tile tagged "Saved"; "Connect with HB-FIN-02.rdp" signs in; account bar line; the drop box view now lists `server_lan` through Lena's session | K2, K3a |
| R3 | On Lena's desktop open passwords.txt; Jake's toast and "In file" tag appear only after it is opened; read door_code.txt | K1, K3a, K3b |
| R5a | Still on Lena's desktop, take SV-OPS-01.rdp; read Ian's card; open SV-OPS-01 from the view: Ian's tile tagged "Captured" and "Saved", the greyed "Connect with SV-OPS-01.rdp" with the policy reason, the password filled; Sign in works | K2, K3a |
| R5b | Connect the SV-OPS-01.rdp from the tray: the screen opens with the refusal under the greyed button | K3b |
| R4 | The explainer's pivot: Switch user on HB-FIN-02 (through the drop box): Jake's tile tagged "In file", the chosen line names passwords.txt, a wrong password is refused, the password typed from the file signs in; Jake's desktop maps `finance_share` with `q3_payroll.txt` | K3a |
| R6 | Open Finance with the PIN, talk Jake into the code. Sign out at HB-FIN-02: the SV-OPS-01 session ends with its "has ended" notice (its reach was through the HB-FIN-02 session), and the drop box view lists `office_lan` only. Connect the code: his desktop opens directly; "Using Jake Brooks's session"; no share folder; the teaching toast. Open `vendor_contract.txt`: the last task completes. Close the desktop: the view still lists `office_lan` only, with no bridge named after Jake. Connect again: the desktop reopens (the session is held). The holder's-keyboard rule (a click opens the sign-in screen, not the relay) is proved by K3c's `interactLoginPc` test and R11's no-route GET /container, since the office stays locked | K2, K3c |
| R7a | With the relay desktop open, the timer ends the invite about 90 seconds after R6's contract read: the desktop closes with "Jake Brooks ended the remote assist.", then Jake's bark | K2, K3c |
| R7b | Connect again: toast "Jake Brooks ended the remote assist." (and, on a game where the timer was not reached, the ink end gives the same) | K2, K3c |
| R8 | (Run B) Reload with the relay desktop open: the relay session is gone, the .rdp session through the drop box is kept, Connect works again, and, once the contract is read, the timer ends the invite after about 90 seconds of play from that read, a reload during it not counting | K2, K3c |
| R9 | Unplug the drop box: the .rdp session ends as a password session would | K2 |
| R10 | No drop box: from Sam's keyboard session, Connect on the .rdp signs in from HB-DESK-01 | K4 |
| R11 | Tampered-client checks of sections 7.4 and 9 | K2, K4 |

### 9.2 What each slice changes in existing scenarios

| Slice | Changes |
|---|---|
| K0 | Remote screens in the two networks scenarios with sign-in hosts. Every remote screen in both loses the "Captured sign-ins" heading and gains tagged captured tiles and K0's lines. `test_access_networks`: tiles under the default, two new PCs, the `nla` policy, the capture card's text, P3's host list and PLAYTEST updates (section 5.4). `lab_physical_pentest`: section D1's lab answer; LW-DOOR01 (headless) shows its captured tiles tagged and the headless line under any answer; PLAYTEST lines 1028 and 1033. The build log has before and after shots of all three hosts |
| K0 | No change in m01 to m10, `lab_social_engineering` or the other test scenarios: none has a foothold, so none opens a remote screen |
| K1 | None (validator checks apply only where `credentials` or `accepts` is authored) |
| K2 | None (no client calls the branch); the session readers change behaviour only for credential sessions |
| K3a to K4 | Only scenarios that declare `credentials` (`test_access_keyring`). K4's `from` param is refused in every scenario without `credentials`; its live proof sends a typed `from: hot_desk_pc` sign-in to LW-DOOR01 on a new `lab_physical_pentest` game with no drop box and expects the refusal |

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

Each decision goes on the picks page with its evidence. D1 is picked after K0's live proof and before K0 merges; D2 to D7 before K1 starts. K0's shots are real (from its live proof). Every shot of a K3a to K4 state is a static mock: one HTML file per state, built from the K0 screen's real CSS and the monitor frame, captured at the named sizes, and labelled "mock". Diagrams that need K1's dungeon graph are hand-drawn Mermaid until K1 exists. Sizes are 1400x1000 and 390x844 unless named.

Mocks to build: (m1) the chosen line with each sign-in kind's tag and button; (m2) the greyed refused saved connection with its reason; (m3) the tray's `[Connect, Examine]` menu; (m4) the relay desktop's bar with Disconnect; (m5) R10's "Remote sign-in from HB-DESK-01" header; (m6) a desktop file's dialog offering Connect beside its existing actions; (m7) the capture log's Captures section as one Sign-ins list with kind tags (D4 (d)); (m8) a Sign-ins item in the tray with its toast (D4 (b)); (m9) one sheet of every toast (find, teaching, Connect's outcomes, ended) as `gameAlert` draws them at 1400x1000 and 390x844, each with its D7 alternative beside it.

### D1. The default remote screen: tiles or typed

- (a) `"tiles"` by default, missions opt into `"typed"` on hardened PCs. (b) `"typed"` by default, tiles only where a scenario opts in.
- Lab sub-question, `lab_physical_pentest` (all three captures read, `revealSecret: true`):

  | Answer | LW-OPEN-07 over the drop box | Hot desk over the drop box |
  |---|---|---|
  | Main today | Hampshire, Lord and Pierce as captured tiles, all filled | the same three captured tiles, all filled |
  | (i) take the default (`tiles` under (a)) | Pierce's PC tile, tagged, filled; Hampshire and Lord gone (the PC does not admit them) | its three PC tiles, each tagged and filled |
  | (ii) a `typed` policy on both PCs | the three captured tiles, filled, and the NLA line | the same, and the NLA line |
  | (iii) as (i), plus `remote: "blocked"` on LW-OPEN-07 | no remote sign-in (the row reads "Remote sign-in off") | as (i) |

- Trade-off: tiles teach account enumeration on every exposed screen and make typed-username puzzles easier; typed teaches the control but hides the lesson unless a scenario opts in. In the lab, Pierce's filled one-click tile on LW-OPEN-07 exists on main today and stays under (i) and (ii); only (iii) removes it, and that is a lab design change (her PC can no longer be reached over the network at all), whereas the lab's scope text points her password at the hot desk (`scenario.json.erb:187`). (i) changes the least: the same accounts reach the same PCs, minus two tiles LW-OPEN-07 would refuse anyway.
- Recommendation: (a), matching the q92 pick and the keyboard screen; a hardened policy is one line. For the lab, (i): it removes only accounts the PC refuses and needs no lab design change; (iii) belongs to a lab pass if the one-click on LW-OPEN-07 is unwanted. Under any answer the lab's remote screens change look (tagged tiles, no heading, K0's lines).
- Blocks: K0's merge (one constant and, under (ii) or (iii), one policy in the lab).
- Evidence:
  - shots (real, K0): Sam's PC over the network before and after the capture cards; HB-OPS-02 (typed, the NLA line); HB-IT-01 (tagged Ian, no duplicate); HB-DOOR-01 (headless line); the main remote screen of Sam's PC today, for comparison; the short-window badge at 915x412;
  - lab shots: LW-OPEN-07, the hot desk and LW-DOOR01 over the drop box with all three captures read, on main today and under (i), (ii) and (iii);
  - JSON: the `finance` and `nla` policy snippets; the lab's policy under (ii) and under (iii); a GET /login_accounts answer over a foothold under `tiles`, under `typed` and for a headless host;
  - list: the two networks scenarios with sign-in hosts and the PCs on each whose remote screen changes under (a) and (b); the scenarios K0 leaves alone.

### D2. The phase 1 kinds

- (a) `saved_connection` and `assist_invite`. (b) also `token` now.
- Recommendation: (a). Tokens need the server clock and the foothold binding, and the content that wants them (the labs' items) needs its own yes (D5).
- Blocks: K1 and K2.
- Evidence:
  - JSON: the `sofia_remote` item (`lab_social_engineering/scenario.json.erb:170-200`); the four registry entries of `test_access_keyring` (9.1); the inline item shape that is not accepted, beside the registry form, with the reason;
  - tables: the kind catalogue (3.6) and the route table (3.7); K2's check list with and without the token rules;
  - mocks: m1 (each sign-in kind's tag and button) and m4 (relay desktop).

### D3. Machine accounts

- (a) a top-level `machineAccounts` block (not `accounts`, which clashes with `social.mail.accounts` and the `loginPicker` value); (b) hashes tied to NPC accounts only.
- Recommendation: (a), in phase 3, with the reader audit.
- Blocks: phase 3 only.
- Evidence:
  - JSON: both shapes for one service account and one hash;
  - list: the server readers that assume a session id is an NPC (`session_identity`, `session_for_client` `game.rb:2400`, `host_row` `network_access.rb:911`, `login_session_answer`, `account_npcs` `game.rb:1896`, `resource_admits_player?` `network_access.rb:1218`, the profile checks), with line numbers.

### D4. A keyring view beyond the sign-in screens

- (a) a Keyring section in the capture log, which only `test_capture_log` carries, so elsewhere this is (c); (b) a Keyring inventory item given when a scenario declares `credentials`; (c) the sign-in screens and Connect only; (d) the capture log's Captures section becomes the Keyring (one list with kind tags, no duplicate rows).
- Recommendation: (c) for phase 1. The sign-in screen is where a credential is used, and "what does this machine accept?" is answered there; (a) and (d) reach one test scenario and duplicate the Captures and Sessions rows; (b) is new UI to justify with a mission that needs it. A further cost of (a), (b) and (d): the tray already labels grouped physical keys "Key Ring" (`systems/inventory.js:1208, 1223, 1238`), so a "Keyring" item or section would give one word two meanings; their mocks (m7, m8) and toasts use "Sign-ins" instead.
- Blocks: nothing in K3a; K3b's toast wording.
- Find toasts, side by side:
  - under (c): as 8.2 ("Saved connection found: HB-FIN-02.rdp for Lena Fox on HB-FIN-02.", "Remote assist code (Jake): Connect it from your inventory to join Jake Brooks's session.", "Jake Brooks's password is in passwords.txt.");
  - under (a) or (d): "New in your capture log: HB-FIN-02.rdp (saved connection for Lena Fox).", "New in your capture log: Jake Brooks's password, in passwords.txt.";
  - under (b): "New in your Sign-ins: HB-FIN-02.rdp (saved connection for Lena Fox). Open Sign-ins in your inventory.".
- Evidence:
  - shots: `test_capture_log`'s log with a captured password (real);
  - mocks: m1, m3, m7, m8, m9;
  - text: the toasts above;
  - list: the scenarios that carry a capture log.

### D5. The labs' granted sessions, for new games

- (a) not in phase 1; convert `lab_social_engineering`'s `sofia_remote` to a `token` credential in phase 2, for new games only; (b) convert it in phase 1 as an `assist_invite`; (c) leave it. For `lab_physical_pentest`'s item: (a) the same as the social lab; (b) leave it.
- Recommendation: (a) for both. The honest kind for a phished foothold is a token, the social lab is played on Hacktivity, and saved games keep their stored scenario data either way.
- Blocks: nothing in phase 1.
- Evidence:
  - JSON: both items with line numbers (`lab_social_engineering/scenario.json.erb:170-200`, `lab_physical_pentest/scenario.json.erb:586`); each item now and as a token credential, side by side;
  - diagrams: their dungeon graph nodes today (real) and as credential nodes (Mermaid).

### D6. Signing in from a desktop (K4)

- (a) keep K4 in phase 1; (b) drop it, so a saved connection always needs a foothold.
- Recommendation: (a). The explainer's worked pivot ("open the .rdp from Sam's desktop") is this slice; without it the found-on-a-desktop chain becomes "find the file, plant a box, come back". It is M and touches only the session readers already changed in K2.
- Blocks: K4.
- Evidence:
  - diagrams (Mermaid): the explainer's pivot sequence (Sam's desktop, the .rdp, Lena's PC, Switch user to Jake) beside the K3-only flow (find, plant, return); the `test_access_keyring` beats R1 to R4 and R10 as a graph with and without the `from` edge;
  - table: the `from` row of the route table (3.7), with the relay-source exclusion;
  - mocks: m5 and m6.

### D7. The on-screen text

- (a) approve section 8.5's tables and 8.2's toasts as written; (b) take the alternative column where given; (c) reword named lines.
- Recommendation: (a). Each teaching line names the control as well as the risk, the tags fit a tile whole, and the engine text is neutral about who the account holder is.
- Blocks: K3a (tags and sign-in lines), K3b (toasts), K3c (relay lines); the K0 lines are part of D1. Placeholders until approved.
- Evidence: the tables with both columns; each sign-in screen line's measured width at 306px beside its alternative's; mocks m1, m2, m4 and m9 carrying the lines in place; the K0 shots for the K0 lines and the "Captured" tag.

## 14. Defaults settled in this plan

- The keyring appears only in scenarios that declare `credentials`; keyboard screens show password entries only, and captured tags appear at a keyboard only in such a scenario.
- One look for a captured account on every remote screen: its tile with a "Captured" tag; tags by kind, at most two per tile, each short enough to fit whole.
- Under picker `accounts`, captured accounts the PC does not admit are not listed.
- A headless host answers its remote screen with no PC tiles and the headless line, never the NLA line; the client reads `headless` and the picker from the answer.
- One phrasing per state on remote screens, the tray and the view; names and hosts are template fields; the engine text uses no pronoun for the account holder.
- Connecting kinds never sign in at the target's own keyboard; a sign-in screen shows only the kinds its route allows.
- `password` is always accepted, and the Password field is always on the chosen line; a list without `password` only warns.
- Admission is not pre-judged; the sign-in teaches it.
- A saved connection the policy refuses is shown greyed with its reason, so honest play meets the refusal.
- Registry password entries never carry the value: the player reads the file, and the tag waits until the file is opened in this page.
- A lockout refuses a saved connection (it presents the password), not an assist invite (the person's own session).
- A relay session is a sink: no pivot, no shares, no `from` source, not in the network view, not offered at the holder's keyboard, not recorded in `signedInPcs`; it ends on reload and is not displaced by its own account holder; the invite stays usable until the NPC ends it.
- K0 to K4 do not depend on UI slice 6; slice 6 owns the lock, and K-lock only widens its lockable sessions to foothold and `from` credential sessions (never a relay); such a session unlocks with the password or a fresh sign-in with the same credential.
- Credential items use an existing type with a tray slot (`text_file`), never a notes or always-allowed type; `credential` is a server-only item field; a credential item may be placed anywhere the `held` scope covers; a declared grant draws a warning for a connecting kind, since it can be claimed at once.
- Connect signs in directly when accepted; a saved connection's screen opens only for a policy or lockout refusal; Connect opens only from an uncovered tray and ignores clicks while running.
- The inline item shape is not accepted.

## Appendix A. Review history (2026-11-13, round 10 applied, loop closed)

For the next agent continuing the plan's review loop. Remove this appendix when the loop ends.

- **Counts (B+M, both sides).** Round 1: server B1 M2, UX B1 M11 (15). Round 2: server B0 M2, UX B2 M8 (12). Round 3: server B1 M2, UX B2 M8 (13). Round 4: server B1 M1 m2 n2, UX B1 M10 m14 n3 (13). Round 5: server B0 M2 m1 n1 (f2ed54ea7), UX B2 M7 m11 n5 (11). Round 6: server B0 M1 m1 n2 (9ca2314bf), UX B0 M4 m9 n5 (34e796af9) (5). Round 7: server B0 M3 m7 n3 (69fe77834), UX B1 M6 m7 n3 (b38394be6) (10). Main 1ce7486c7 merged into `plan/keyring` before round 4 was applied.
- **Round 4 re-check on the merged code.** Every finding held; none rejected. Evidence re-read: `network_access.rb:1115, 1218-1256, 1265-1285, 1183-1194`; `game.rb:2051, 2416-2430, 2758-2782, 2914-2924`; `unlock-system.js:260, 302-307`; `password-minigame.js:358-363`; `network-links.js:66-68`; `network-view-minigame.js:59`; `screen-states.js:83`; `pc-sessions.js:49, 545`; `README_scenario_design.md:298, 2753, 2755`; `scenario-schema.json:785`; `inventory-menu.js:171-174`; `password-minigame.css:779, 1067`; lab `scenario.json.erb:78, 187, 1698, 1893-1950`; `test_access_networks/scenario.json.erb:295`; lab `PLAYTEST.md:1028, 1033`; no `x-ref` in the schema code.
- **Round 5 re-check.** Every finding held; none rejected. Evidence: `network_access.rb:772, 790, 812, 828` (view readers take every session); no session `locked` code on main (grep of app/, lib/ and the engine); `ui/scenario-timer-dispatcher.js:86-96` (reload resumes a timer).
- **Choices made.** Round 4: the `held` scope gains declared grants; no relay sign-in screen; neutral engine text, per-entry teaching override to the backlog; the 14px overflow fix folded into K0. Round 5: every `locked` item moves to a follow-up K-lock (8.6) after both K3c and UI slice 6, so K2 and K3 do not wait on q93; the teaching line is toast-only on every screen; the tile row is one row on the 560x350 base; K0 lines kept to about 60 characters; remote error lines move into K0; the test timer is 90 s and Run A checks the view and keyboard while the relay is held; a prompt sync during a relay.
- **Round 6 re-check and what is applied.** All five majors held (`network_access.rb:475-479`: the implant session-shape branch takes any blank-foothold session; `:1115-1125`: Sam's keyboard session pivots, so R2's `server_lan` came through HB-DESK-01). Applied: the implant reader in 3.8; R1 ends with a sign-out at HB-DESK-01; a two-line message slot with K0 lines at most two lines at 390x844 and the fit test at all four sizes; a short refused reason under the greyed button with the full one in the message slot on click; name-free not-permitted and lockout lines that also serve a typed name. **Round 6 minors and nits, applied after the majors:** server m1 (GET /keyring on `set_game`, off `with_game_lock`), n1 (Ruby paths in the header), n2 (a relay sign-in keeps the guest-session end, documented in 7.2); UX m1 (Connect step 8 maps the 403 and 422 races), m2 (missing-entry label from the tray item's `name`), m3 (assist line says "the session"), m4 (label cut keeping fixed words; first button at all four sizes), m5 (R3's sign-in half in K3a's proof), m6 (keyboard combined failure line), m7 (`badge-key.png`, `badge-plug.png`, hand-drawn 8x8), m8 (evidence list under 1.1), m9 (remote .rdp desktop top bar worst case); nits n1 (R8 timing), n2 (`state-sync.js` path), n3 (toast comma), n4 (`showCountdown: false`), n5 (find toast held during a conversation).
- **Round 7 re-check and what is applied.** All ten held; none rejected. Evidence: `objectives-manager.js:332-334` completes `unlock_object` on any `pc_signed_in`, `game.rb:3733-3736` requires `signedInPcs`; `games_controller.rb:425` builds `sessions` before `:437` ends claims, `pc-sessions.js:178-191` drops only claims; `network_access.rb:298` unplug never prunes; `password-minigame.css:852` 360px form cap, `:893-895` empty message hidden; `pc-monitor-frame.test.mjs:468-475` stubs layout; `game.rb:2257-2261` lockouts never expire, `game.rb:2072` no `maxAttempts` means no limit. Applied: relay kept out of the client `signedIn`, objectives and the bootstrap `sessions`, with a validator warning; K4 gains a `from` branch on GET /login_accounts and `attempt_login!`, prune after unplug and borrow-done, and no self-source; the found-password line on two lines; chosen-state fit by folding, gaps and a header join, with only the ways-in list scrolling; a real-browser fit check `tools/playtest/signin-fit.mjs`; `finance_desk` on Lena's PC and a validator info line for lockout stranding; shorter refusal lines measured at 306px; `foundIn` required. Also applied, being cheap: UX m1 (host source on failure), m2 ("saved sign-ins" wording, beside the Key Ring), m3 (`aria-disabled`), and UX m5 (no self `from` source). **Not applied, round 7 minors and nits** (see the R7 files): server m1 (a `foothold=` request opens a relay desktop), m2 (a relay Connect replaces the player's own session without pruning), m3 (the claim checks are unnamed relay readers), m4 (no implant-through-relay test), m5 (a saved connection from a grant or NPC gift is not hard-enforced), m6 (`from` cycles leave zombie sessions), m7 (K3b ships an invite Connect only K3c completes); UX m4 (no sync before the screen's `/keyring`), m6 (now covered by the new Fit text), m7 (the invite is never necessary in the test scenario); six nits.
- **Round 8 re-check and what is applied.** Counts: server B0 M1 m10 n3 (019d84a70), UX B0 M3 m5 n8 (1b13e9dfc) (4). All four held. Evidence: `unlock-system.js:482` (`interactLoginPc` opens the desktop on `pcSessions.has`), `:618`, `:624`, claim guards `game.rb:2227, 2296`; the chosen-state fold `password-minigame.css:1045` is shared with the keyboard screen. Applied: one `heldAtKeyboard` helper on the world click path and the keyboard screen, and a claim or sign-in at the holder's keyboard replaces a relay session; the new fit rules scoped to the remote screen; no join of the "Signed in now" line (4px gaps at x2, 2px slab padding at 915x412); a relay desktop line on why no shares show. Also applied, cheap: GET /keyring route and `GamePolicy#keyring?`; K3b gives Connect to saved connections only. **Coordinator facts (UI slice 6 lock, `build/ui-slice6-lock` 20a8a83a7, read by `git show`):** section 2 now states slice 6's server side; 8.6 cut to widening slice 6's lockable sessions to foothold and `from` credential sessions (relay refused); 3.8 notes the `reach_walk` skip and `reach_cache_key` interaction. **Not applied, round 8 minors** (see the R8 files): server, a request with a foothold can open a relay desktop (`network_access.rb:1185`); a relay sign-in that replaces a pivot session does not prune onward sessions; K4 `from` cycles are never ended; grant-placed saved connections are treated as valid though claimable at once; six more minors; UX five minors; eleven nits in all.
- **Convergence call after round 8.** B+M by round: 15, 12, 13, 13, 11, 5, 10, 4. Round 8's 4 is above the 2 needed to call convergence and well under round 5's 11, so the scope cut is not taken. The relay keeps producing findings (round 8: the world click path), and fit findings now come from measurement, not from missing rules.
- **Recurring themes.** Each round has found more relay reach readers (round 3 the reach walk, round 4 shares and `from`, round 5 the view's bridge labels) and more fit problems on the 560x350 monitor base (rounds 3 to 5). The relay and the K3 layout carry most of the remaining risk.
- **Round 8 minors and nits applied (after merging main 48b755b81, no conflicts).** Server m1 (the foothold desktop branch refuses a relay or `from` record), m2 (prune after any sign-in that replaces a session, `endedPcIds` in the login answer, prune ends a `from` session whose source is a relay), m3 (a `from` sign-in onto its own chain is refused; prune ends a repeating walk), m4 (`npc_workaround` answers `endedPcIds`; `displaced()` passes its logout answer on), m5 (the mirror's shape for relay and `from` sessions and the three client readers), m6 (relay Connect and the invite toast move to K3c), m7 (`item_definition` a static walk, shares and flag rewards included), m8 (grant-placed saved connection warns), m9 (already in 6.2), m10 (the `from` row names source and target); n1 (no server `displaced`), n2 (`targetOff` only with routes), n3 (POST /login dispatch order). UX m1 (line-count check in `signin-fit.mjs`, 32-glyph estimate, first credential button in its failure list, short reason "{host}: type the password."), m2 ("+N" in place of the second tag), m3 ("Your found sign-ins could not be loaded."), m4 (D4's "Key Ring" clash; mocks say "Sign-ins"), m5 (HB-FIN-03 takes `jake_desk` with `remote: "blocked"`); nits n1 to n8. Evidence re-read: `network_access.rb:1183-1193, 1150-1166`; `game.rb:2914-2924`; `games_controller.rb:1357, 1426-1440`; `pc-sessions.js:383-395, 421-436`; `capture-log-model.js:94-110`; `network-links.js:694-708`; `container-minigame.js:50-62`; `inventory-menu.js:145`.
- **Round 9.** Counts: server B0 M2 m5 n3 (633787d92), UX B0 M2 m8 n7 (27a5b0e85) (4). All four majors held on re-check; none rejected. Evidence: `network_access.rb:1129-1137` (`networks_reachable_from` is a plain link walk with no session needed), `:1081-1112` (the foothold pivot walk needs a session per network crossed), `game.rb:2141-2182` (no `credentials` gate on the typed branch); slice 6 `lock_session!` on 20a8a83a7 refuses non-password sessions because the password is the only way back; `game.rb:2914-2924` (a fresh sign-in drops `locked`); the beat order R4 before R6 with `jake_pc` in Finance; the UX reviewer's calibrated replica (reproduces today's 364/350) for the Switch user heights. Applied: K4 judges the `from` target by `from_reach` (the pivot walk seeded from the source network) and answers `from` only in a scenario with `credentials`, with a lab tampered-client check; K-lock lets a fresh sign-in with the same credential unlock (Connect re-signs in, `sessionHeld` false while locked), dropping "no credential-based unlock"; HB-FIN-03 moves into a Jake's office that stays locked, with `vendor_contract.txt` as the relay's own payoff and the last task; on remote Switch user screens the "Signed in now" and remote lines merge and the label slabs go at x2 and in the short window, with new K0 fixtures and a 35px (x2) and 20px (915x412) target. **Not applied, round 9 minors and nits** (see the R9 files): server m1 (Connect on the invite replaces a keyboard password session), m2 (the claim guard change is tagged K3c but K2 tests it), m3 (`endedRelayPcIds` sent once; a lost answer leaves the relay desktop open), m4 (a locked session not excluded as a `from` source; `from_reach` now excludes it on networks crossed, the source itself still open), m5 (`settle_session_at_keyboard!` would strip `from` from a typed `from` session); n1 to n3. UX m1 to m8 and n1 to n7.
- **Round 10 (the last round).** Counts: server B0 M2 m6 n5 (729fc6252), UX B0 M2 m10 n6 (4e33fe3a3) (4). All four majors held; none rejected. Evidence: `network_access.rb:1089-1104` (the pivot walk reads `reach_session_hosts` and never calls `session_route_up?` on a pivot, so a `from_reach` that did would recurse); `held` needs the item in the inventory, so a desktop Connect without a take fails K2 step 2; the timer armed on the first relay desktop could end the invite before `vendor_contract.txt` was read, stranding the last task (remote blocked, office locked, `endedCredentials` grow-only); `pc-sessions.js:88-93` `unplugEndedMessage` is the only text `linkDropped` shows, so a pruned session would say "Unplugged". Applied: `from_reach` is `reach_walk_uncached` copied and seeded from the source network, with access and structural variants named per caller and the cache key; the desktop Connect takes the file first (mock m6 reworded to the real dialog); the timer and the ink end arm only on `jake_contract_read`, with a README rule and the stranding case for the picks page; `linkDropped` gains a reason and 8.5 a "route ended" line. Round 9's four cheap server minors were applied before round 10 (46bdbafb7).
- **Convergence call.** B+M by round: 15, 12, 13, 13, 11, 5, 10, 4, 4, 4. Rounds 9 and 10 each found 4, so the plan did not reach the 2-or-fewer bar; round 10 was the last round by the brief. Every blocker and major from every round is applied; **no item above minor is open.** The scope cut was not taken.
- **Known open items for the build to settle (all minor or nit; see the R9 and R10 files).** Server R10: m1 `reach_cache_key` holds only session ids, so a relay or lock change needs its own term (latent today); m2 K-lock's `sessionHeld: false` while locked must be written into GET /keyring's rule, not assumed; m3 a `from` source locked after sign-in has no rule, and no slice owns the lock checks if K4 lands before slice 6; m4 a `from` session is not pruned when its target network leaves structural reach; m5 the bootstrap `sessions` answer should also leave out `from` sessions the same request prunes; m6 K1's notepad forgery test must assert the stored item has no `credential`. UX R10: the "Assist" tag is listed but never drawn (drop it from the tag table); the short-window badge for an account with both a key and a plug credential; K0's three-tag fixture cannot exist before K3a; ellipsis cuts tested in jsdom and flagged by the `scrollWidth` rule; the assist teaching line addresses the attacker; `from` sessions need merged-slab wording and one preposition for the route; with one task, R3 to R5 show no `verify-run` progress; D4 (a) has no mock; the merged slab reads as if the holder came through the drop box and drops the username; the 915x412 Switch user baseline (322 of 306 in round 9, 306 of 306 in round 10) to be re-measured in K0. Server R9 m1 (Connect on an invite replaces a keyboard password session) and UX R9 m1 to m8 that R10 did not repeat.
- **Next step (was, before round 9).** Apply the round 8 minors above (the foothold-to-relay desktop request and the prune after a relay sign-in first), then round 9 with fresh reviewers on the same two briefs (plan body only, no Appendix A, no review files). Converged at the first round with B+M of 2 or fewer, applied. If round 9 is not better than round 8's 4, consider the scope cut: phase 1a is K0, K1, K2 without the relay branch, and K3a; phase 1b is K3b, K3c, K4 and K-lock under their own plan.
- **Files touched:** `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` and the review files beside it. Branch `plan/keyring` in worktree `.claude/worktrees/p-keyring-plan`.
- **Gotchas:** HB-DOOR-01 and LW-DOOR01 are headless; the capture log is carried only by `test_capture_log`; PUT /sync_state loads no `scenario_data`; bootstrap writers run only when `bootstrap_state_needs_write?`; `notes` items never take a tray slot; accounts must be room NPCs; timers run in real time and resume on reload; UI slice 6 is not on main; commit with explicit paths, UK English, no em or en dashes, no model names in repo files.
