# D1: networks, hosts, footholds, remote sign-in, shares, pivots, network view

Digest for planners. Paths are relative to the worktree root. Line numbers were read on 2026-11-19 and will drift. Items marked **unconfirmed** were not checked in code.

Short forms: `NM` = `lib/break_escape/network_model.rb`; `NA` = `app/models/break_escape/network_access.rb`; `GM` = `app/models/break_escape/game.rb`; `GC` = `app/controllers/break_escape/games_controller.rb`; `VN` = `scripts/validate_network.rb`; `SCH` = `scripts/scenario-schema.json`; `NL` = `public/break_escape/js/systems/network-links.js`; `NV` = `public/break_escape/js/minigames/network-view/network-view-minigame.js`.

---

## 0. Vocabulary in the code

- **Network**: a key in top-level `networks` (`{ name, offWhen?, wifi? }`). Server-only (`NA:18`, `SCH:317-340`).
- **Host**: not a separate scenario type. A host is a room object (or container-free object) with `lockType: "login"` (a sign-in object). `NM:46-48` (`sign_in_object?`). Its label is `host` (or `name`). Headless hosts are sign-in objects with `headless: true` (`NM:54-56`).
- **Resource**: top-level `resources.<id>`, kind `file_share` (or `printer`, or other label). Lives on a network, may have `host`, `access`, `contents`, `offWhen`, `object` (`SCH:347-366`).
- **Jack**: room object with `networkJack: true` (`NM:50-52`). Planting a `rogueDevice` item gives a **foothold**.
- **Foothold**: a server record in `player_state.footholds` keyed by id. Two shapes today: `jack_<jackId>` (`NA:40-42`, `foothold_id_for`), plus Wi-Fi and implant footholds (`NA:332-337` `wifi_foothold_id`, `NA:428-431` `implant_foothold_id_for`).
- **Session**: an entry in `player_state.sessions[pcId]`, opened at a sign-in PC (`GM` access section; `access_sessions` at `GM:3231-3234`). A remote session also carries `foothold`, `from` (keyring K4 route) and `via`.
- **Network link**: a two-item list in top-level `networkLinks`, undirected (`NM:176-189`).
- **Reach**: the set of networks a foothold can use: `player_reach(foothold_id)` (`NA:1201-1203`), computed by `reach_walk` (`NA:1210-1214`) and `reach_spread` (`NA:1256-1290`).

---

## 1. Data model (scenario fields)

### 1.1 Top-level keys

| key | schema | notes | pointer |
|---|---|---|---|
| `networks` | `SCH:317-340` | id → `{ name (minLength 1), offWhen, wifi }`; `additionalProperties: false`; `x-serverOnly`, `x-servedBy: GET /network, GET /container`. | `SCH:317`, `SCH:327` (offWhen), `SCH:328` (wifi) |
| `networkLinks` | `SCH:341-346` | array of `[string, string]`, `x-serverOnly`. | `SCH:341` |
| `resources` | `SCH:347-366` | id → resource; `kind`, `name`, `host`, `network` (x-ref network), `access`, `contents`, `observations`, `offWhen`, `object`. | `SCH:347`, `SCH:358-363` |
| `policies.<name>` | `SCH:261-280` | `remote` (`allowed` / `blocked`, `SCH:273`), `remoteScreen` (`tiles` / `typed`, `SCH:274`), plus `usb`, `social`, `accepts`, `autoLockMin`, `maxAttempts` (other features). | `SCH:261` |
| `defaultPolicy` | top level | policy for PCs with no `policy` field. | `VN:73-74` uses it (`effective_policy`) |
| `credentials` | `SCH:281` | server-only keyring registry (not networks, but read beside them). | `SCH:281` |

Server-only (never sent to the browser): `networks`, `networkLinks`, `resources` are removed from the bootstrap by `withhold_network_keys!` (`NA:18-27`; called from `GM:2488`). Object fields `network`, `linkName`, `linkStoreIn` are deleted from every object (`NA:21`, `GM:2759-2762`). Schema marks `network` on a room and on an object as `x-serverOnly` (`SCH:4225`, `SCH:5525`).

### 1.2 Object fields (room objects, `SCH` object definition near 5509-5560, 5653)

| field | schema | meaning | pointer |
|---|---|---|---|
| `network` | `SCH:5525` | object's network (beats room default `SCH:4225`). Never sent. | `NM:38-44` |
| `host` | `SCH:5526` | a PC's label on the network and its taskbar name | `NM`/`NA:882` (`host_label`) |
| `lockType: "login"` | (existing) | makes it a sign-in object (host) | `NM:46-48` |
| `headless` | `SCH:5537` | sign-in object with no screen/keyboard; remote only | `NM:54-56` |
| `networkJack` | `SCH:5538` | jack | `NM:50-52` |
| `jackConfirm` | `SCH:5539`-ish (near 5538) | confirm text | `NL` (N1 in doc) |
| `plantedSprite` | near 5539 | sprite when planted | doc N1 |
| `requiresItemHint` | (object) | nothing-to-plug-in line | `NL:411` (doc N1) |
| `panelPorts` | `SCH:5544` | patch-panel port list `{port 1-24, label, desk, jack}` | `VN:165-189` |
| `panelOf` | (jack) `SCH:5542` | panel id in same room | `VN:152-158` |
| `rogueDevice` | `SCH:5545` | takeable item with id, can be planted | `NM:58-60` |
| `wifiAp` | `SCH:5546` | Wi-Fi access point on a network with a `wifi` block | `NM:330-336` |
| `wifiTwin` | `SCH:5547` | planted rogue AP console (rogue-ap minigame) | doc N8 |
| `portSecurity` | `SCH:5653` | jack refuses unknown device | `NA:111-119` (`port_security_refusal`) |
| `offWhen` | `SCH:5510` | sign-in PC outage (governs the player too) | doc N7 |
| `usbClass` (item) | (item) | `hid` / `storage`; checked by PC `usb` policy | doc N10 |

### 1.3 Grant-foothold action (implants)

`{ "type": "grant_foothold", "pc", "needsSession", "needsHeld", "needsDropped", "name" }` (`SCH:3949` type enum). Only actions on a server-run path count: `NM:256-271` (`grant_foothold_actions`, uses `DeclaredGrants.executed?`). Shape is `session` if `needsSession` is set, else `dropped` (`NM:266`).

### 1.4 Where a "host" is defined today

There is no `hosts` key. A host is a sign-in object in a room. Hosts on a network are found by `NM.sign_in_objects_on(network_id, data)` (`NM:115-120`, sorted by id). Resources on a network: `NM.resources_on` (`NM:124-129`, sorted by id). Host fields used by server and view: `id`, `name`, `host`, `sprite` (default `pc_desktop`, `NV`/`NA:1044-1050`), `headless`, `policy`, `offWhen`, `owner`, `loginPicker`, `access`. Room context: `rooms.<id>.network` default (`NM:42-44`).

### 1.5 Model helpers (all in `lib/break_escape/network_model.rb`, module `BreakEscape::NetworkModel`)

`networks` (22), `resources` (30), `network_of` (38), `sign_in_object?` (46), `jack?` (50), `headless?` (54), `rogue_device?` (58), `resource_contents?` (65), `listed_only_share?` (71), `room_objects` (79, walks containers, not under sign-in objects), `jacks` (106), `sign_in_objects_on` (115), `resources_on` (124), `sort_by_id` (132), `rogue_device_definitions` (138; home is room/container/start/npc/grant), `network_links` (176), `linked_networks` (192), `all_reach_paths` (212), `reach_paths` (244), `grant_foothold_actions` (256), `reach_conditions` (282), `truthy?` (315), `wifi_of` (322), `wifi_aps` (330), `present_string?` (338). Constants: `REACH_PATHS_CAP = 8` (206), `REACH_PATHS_CEILING = 64` (207).

---

## 2. Server

### 2.1 Routes (`config/routes.rb`, member routes of games)

| method, path | action | pointer |
|---|---|---|
| GET `/games/:id/network` (`?foothold=`) | `games#network` | `config/routes.rb:51`; `GC:1750-1755` |
| POST `/games/:id/network/plant` (`jack_id`, opt `device_id`, `delta`) | `games#network_plant` | `routes.rb:52`; `GC:1758-1767` |
| POST `/games/:id/network/unplug` (`jack_id`, `delta`) | `games#network_unplug` | `routes.rb:53`; `GC:1812-1820` |
| POST `/games/:id/network/implant` (`pc_id`, `shape` = dropped/session, opt `path`, `delta`) | `games#network_implant` | `routes.rb:54`; `GC:1825-1838` |
| POST `/games/:id/network/join` (`ap_id`, opt `key`, `delta`) | `games#network_join` | `routes.rb:55`; `GC:1801-1809` |
| GET `/games/:id/container/:container_id` | `games#container` | `routes.rb:27`; `GC:626-668` (shares and sign-in desktops) |
| POST `/games/:id/login` | `games#login` | `routes.rb:38`; `GC:1516-1559` |
| POST `/games/:id/logout` (`pc_id`) | `games#logout` | `routes.rb:39`; `GC:1562-1572` |
| POST `/games/:id/lock_session` (`pc_id`) | `games#lock_session` | `routes.rb:40`; `GC:1580-1586` |
| GET `/games/:id/login_accounts?pc_id=` (and `foothold=`) | `games#login_accounts` | `routes.rb:41`; `GC:1593-1610` (no-store header `GC:1595`) |
| GET `/games/:id/capture_secrets` (adds `accounts`) | `games#capture_secrets` | `routes.rb` (near `:60`, unconfirmed); `GC:1842-1855` |
| GET `/games/:id/keyring` (`pc_id`, `foothold`, `from`, `relay`) | `games#keyring` | `GC:1862-1880` |
| GET `/games/:id/scenario` (bootstrap, adds `footholds`, `gainedFootholds`, `sessions`, `signedInPcs`) | `games#scenario` | `GC:303`; the additions at `GC:440-460` (`footholds` `GC:458`, `gainedFootholds` `GC:459`) |
| GET `/games/:id/room/:room_id` | `games#room` | `GC:550` (rooms lazy-loaded; `attach_network_state!` on jacks at `GM:2759-2762`, see `NA:30-37`) |
| POST `/games/:id/clone_card` | `games#clone_card` | `routes.rb:42` |
| PUT `/games/:id/sync_state` | `games#sync_state` | `GC:867`; network state is **not** a sync section (see 2.5) |

All network-writing actions are in the `set_game` before_action list (`GC:92-99`) and the `with_game_lock` around_action list (`GC:103-108`), which reload under a row lock. Only the routes in these lists take the lock.

Route params beyond those above: the `delta: true` opt-in (`GC:2363-2366`, `inventory_delta_opt_in?`). The engine always sends `delta: true` from `api-client.js` (`networkPlant`, `networkUnplug`, `networkImplant`, `networkJoin`).

### 2.2 Response shapes

- `GET /network` → `{ footholds: [ <foothold> ] }` (`NA:746-777`). Each foothold (`NA:724-729` `foothold_for_client`): `{ id, via, name, itemId, sourceId, network: { id, name }, place }`, plus `sprite`, `observations`, `storeIn` (`NA:738-744`, `footholds_for_client`); view extras `responding`, `sourceHost`, `hosts` (rows of its own network, only if `network_up?`), `networks` (blocks). 404 `{ error: "Foothold not found: ..." }` (`NA:752-754`).
- Host row (`NA:1043-1076` `host_row`): `{ id, kind: 'pc', name, host, sprite, headless, remoteSignIn, session?, responding?, heldAs? }`. `session` is only `{ username, displayName, via, remote, route?, locked? }` and only for a password session with an account holder and not a claim/relay (`NA:1048-1058`). Off host: `responding: false` and nothing else (`NA:1064-1067`).
- Resource row (`NA:1078-1086` `resource_row`): `{ id, kind, name, host, open (bool, access nil), listed?, observations? }`. Contents are never in the row.
- Blocks (`NA:795-835` `network_blocks`, `down_blocks` `NA:813`, `via_for` `NA:855`): one `up` entry per reachable network with `via` (host and session it is reached through), and one greyed `down` entry per held-session network that is now unreachable. Networks neither reached nor held are absent.
- Plant (`NA:233-288`): `{ success, foothold, first, added, removed }` (or `inventory` echo if no `delta`), `already: true` on repeat. Refusals: 404 `Jack not found`; 403 `reason: 'unreachable'`; 422 `reason: 'port_security'`; 422 `reason: 'no_device'` (`NA:75`, `NA:81-120`).
- Unplug (`NA:290-325`): `{ success, endedPcIds, added, removed, tokenExpiredPcIds? }`. Refusals: 404; 422 `reason: 'not_planted'`; 403 `unreachable`.
- Join (`NA:355-398`), Implant (`NA:468-548`): `{ success, foothold, first, consumedId, added, removed }`; refusals include 404 `no_action`, 422 `not_ready`, 422 `usb_refused`.
- Login (`GM:3444-3520`, `GM:4433-4461`): success carries `remote: true, footholdId, host` when a foothold was used (`GM:4457-4460`). Refusals: `NetworkAccess::REMOTE_BLOCKED` text with `remoteBlocked: true` (`GM:3462`, `NA:1091`); `PC_NOT_RESPONDING_MESSAGE` with `reason: 'not_responding'` (`NA:1002`); `PC_OFF_MESSAGE` with `reason: 'off'` (`NA:1001`).
- Container (`GC:626-668`): for a share not admitted, `404 Container not found` (same as an invented id). Unreachable sign-in PC through a route: 403 `reason: 'unreachable'`.

### 2.3 Where player reach is computed

- `player_reach(foothold_id)` = `reach_walk(..., ignore_outages: false)` (`NA:1201-1203`). Structural reach (ignores outages, used by the view to name bridges) = `structural_reach` (`NA:1194-1196`).
- `reach_walk_uncached` (`NA:1239-1254`): own network of the foothold, if up; no reach if implant source PC is off (`NA:1247-1249`); then `reach_spread`.
- `reach_spread` (`NA:1256-1290`): fixpoint. From every reached, up network on which a **held session host** stands, add linked up networks. A host with service off relays nothing (`NA:1275`); a locked session extends no reach in the access walk (`NA:1281-1283`).
- Reach is memoised per game object in `@reach_cache` (`NA:1216-1237`, cache key includes the foothold JSON, pivots, outages, host off, locked sessions, networks and links JSON).
- `from`-route reach is separate (`from_reach` `NA:1310-1323`; `from_chain` `NA:1325`).
- `networks_reachable_from` (`NA:1417`), `host_reachable_through?(foothold_id, pc)` (`NA:1477-1493`): reach contains the host's network.
- Scenario-level reach paths for the dungeon graph: `NM.reach_paths` (`NM:244-246`).

### 2.4 Footholds, sessions and where they are stored

- `player_state['footholds']` = `{ footholdId => { via: 'jack'|'wifi'|'implant', network, source, device?, seq, name, ... } }` (written at `NA:268-277` plant; `NA:378-388` join; `NA:525-532` implant). `seq` orders them (`NA:731-735`).
- `player_state['gainedFootholds']` = list of jack/AP/PC ids ever gained (`NA:50-54`, writes `NA:276-277`, `NA:387-388`, `NA:403-404`, `NA:531-532`).
- `player_state['inventory']`: plant removes the device and adds the link item (`NA:250-251`, `NA:282`). Link item id via `link_item_id` (`NA:668`), built by `link_item_for` (`NA:677`), `wifi_link_item_for` (`NA:703`), `implant_link_item` (`NA:651`).
- `player_state['sessions']` (`GM:3022` default `{}`); a remote session records `foothold` (`GM:4402-4403`), `from` and `via`; `session_locked?` for locks (`GM:3231-3234` area). Session ended by unplug: `end_sessions_through!` (`NA:410-416`); onward sessions pruned: `prune_unreachable_sessions!` (`NA:1446-1472`, called `NA:309`).
- `ACCESS_STATE_DEFAULTS` at `GM:3021-3030` sets `sessions`, `signedInPcs`, `loginFailures`, `loginLockouts`, `copiedItems`, `serverClones`, `footholds`, `gainedFootholds` and others. Initialised via `GM:7576`. Doc comment at `NA:7-14`.
- Footholds are server-written. The sync merge functions named in `GC:2745` (`merge_last_write_wins_sections`) and `GC:2860` (`merge_grow_only_sections`) do not read `footholds` or `sessions`. Inference from the absence of those keys in the merge code: **not checked in every merge function**.

### 2.5 What is withheld, and where filtering happens

- Bootstrap (`GM:2390`, `filtered_scenario_for_bootstrap`): deletes `networks`, `networkLinks`, `resources` (`GM:2488`, `NA:18`), `accountProfiles`, `roles`, `credentials`. Object `network`, `linkName`, `linkStoreIn` are stripped in `NA:21` (applied by room/object sender; the bootstrap path `GM:2759-2762` calls `attach_network_state!`).
- Jack state: `jackPlanted` is set on each jack from `network_footholds` (`NA:30-37`).
- `/network` answers only own rows and blocks, never a network's full host list or resource contents (`NA:746-835`). Account tiles through a foothold are judged by reach, policy and power (`NA:911-934`).
- Resource contents are served only by `GET /container` after `resource_admits_player?` (`NA:1580-1628`; `GC:640-645`).
- Shares mapped on desktops: `mapped_shares` (`NA:1631-1658`), sorted by id.
- Capture secrets: `GET /capture_secrets` (`GC:1842+`).
- Delta sending: network routes answer `added`/`removed` (`NA:206-231`, `network_inventory_delta`) only when `delta: true`; otherwise the whole `inventory` (`NA:224-231`). Sessions answer changes as `{ success, pcId, locked }` (`GC:1576-1578` comment), and `endedPcIds` / `tokenExpiredPcIds` lists.
- Bootstrap sends `footholds`, `gainedFootholds` (`GC:458-459`), `sessions`, `signedInPcs`, `sessionLockingSupported`, `credentialsDeclared` (`GC:440-456`).

### 2.6 Gating and ordering

- Plant/unplug/implant/join run `object_reachable?` (`NA:121-129`). Plant requires `panel_unlocked?` for a `panelOf` jack (`NA:131-137`).
- Device must be a held server item (`held_rogue_device` `NA:143-168`); a client-forged item is refused by design (doc N1).
- Hosts: the foothold route to a host is `host_reachable_through?` (`NA:1477`), then the host service must be on (`GM:3466-3468`), then policy `remote != 'blocked'` (`GM:3469-3472`).
- Headless hosts: keyboard sign-in refused as unreachable (`GM:3474`), claims refused (`GM:3534-3538`, `GM:3603-3608`), remote tiles empty (`NA:954-957`).
- Claim with a foothold is refused: `GM:3534`, `GM:3604`.
- Unlock of a jack task is met only after a foothold was gained there: `GM:5250-5263` (`gained_footholds.include?`).

---

## 3. Client

### 3.1 Files

| file | lines | role |
|---|---|---|
| `public/break_escape/js/systems/network-links.js` | 871 | the only client module that asks about networks (header `NL:1-52`). Exposed as `window.networkLinks` (`NL:868-869`). |
| `public/break_escape/js/minigames/network-view/network-view-minigame.js` | 977 | the view scene (header `NV:1-65`). |
| `public/break_escape/js/minigames/patch-panel/patch-panel-minigame.js` (291) and `patch-panel-model.js` (158) | | 24-port panel (header in file, lines 1-9). |
| `public/break_escape/js/minigames/rogue-ap/rogue-ap-minigame.js` (433) and `rogue-ap-model.js` (137) | | pocket rogue AP console: Recon / Clone / Log (header lines 1-16). |
| `public/break_escape/js/api-client.js` | `:177-` and `:216-218` | client calls: `networkPlant`, `networkUnplug`, `networkImplant`, `networkJoin`, `network(footholdId)`. |
| `public/break_escape/js/systems/unlock-system.js` | `:351`, `:449`, `:1810-1816` | `openRemoteSignIn`, `openRemoteDesktop`, `openFromDesktop` (window globals). |
| `public/break_escape/js/minigames/index.js` | `:180-182`, `:245`, `:267` | registers scene `network-view` (`:245`) and window helper `startNetworkViewMinigame` (`:267`). Patch panel `:185`, `:246`. Rogue AP `:122` (import only). |

### 3.2 How the network view is opened

1. A click on a jack (`interactions.js:980-983` `networkLinks.interactJack`). A Wi-Fi AP click at `interactions.js:988-990`. A patch-panel port at `interactions.js:995-1003`.
2. `interactJack` (`NL:382`): a planted jack opens its box's view with Unplug (`NL:` `unplugFromView` at `NL:548`); with no device it shows `requiresItemHint`; otherwise it confirms with `jackConfirm` then calls `plant` (`NL:416`).
3. `plant` (`NL:416-466`) calls `api.networkPlant`, then the tray, the jack sprite and the global `<jackId>_planted`, and emits events.
4. `open(footholdId, { returnTo, atJack, jackSprite })` (`NL:708-727`) starts a "trip" and calls `_showView` (`NL:753-770`), which calls `window.startNetworkViewMinigame(footholdId, { message, unplugJack })` (`NL:754-758`). Without the view, a toast is shown and the trip ends (`NL:762-766`).
5. `startNetworkViewMinigame` (`NV:961-975`) calls `framework.startMinigame('network-view', null, { title, footholdId, message, unplugJack })`.

Reopen after a sub-screen: `resume(message)` (`NL:772-790`). End of trip: `leave(reason)` (`NL:792-802`) emits `network_view_closed`, then `returnTo({ reason })` one tick later. Landings: `landed(screen, reason, detail)` (`NL:837` onwards).

### 3.3 How it fetches and renders rows

- `NetworkLinks.view(footholdId, { sync })` (`NL:259-292`): first `syncBeforeFetch` (`NL:264-268`, waits up to `VIEW_SYNC_WAIT_MS = 3000`, `NL:68`), then `api.network(footholdId)` (`NL:275`). A 404 drops the foothold (`NL:276-278`). Stores `views` and `footholds` (`NL:289-291`).
- The view's `load({ sync })` (`NV:403`) and `emitViewed()` (`NV:448-462`).
- Refetch every 5000 ms (`NV:86`, `REFETCH_MS`), widening to 15000 ms after 3 unchanged answers (`NV:88-90`, `REFETCH_IDLE_*`). Scheduling at `NV:473-478`.
- Row ordering: hosts (kind `pc`) then resources. `KIND_RANK` / `displayOrder` (`NV:138-147`).
- Host action (`NV:215-227` `hostAction`): "Remote sign-in off" (no control) when `remoteSignIn === false`; "Open" with the account's name when a password session is held (`row.session` present); otherwise "Sign in". Resource action `NV:229-233` (`open`, `locked`, or `observe` for `listed`).
- Down states in `downState` (`NV:159-173`): `(down)`, `No route`, `(powered down)`, `Session kept: <name>`. Constants `NV:91-104`.
- Lock badge (`NV:108-117`): `Locked` for a host, `Needs account` for a share (`NV:126`).
- Header and subtitle: `viewSubtitle` (`NV:188-205`); Wi-Fi status `joinedStatus` (`NV:207`).
- DOM hooks: `data-host-id`, `data-resource-id`, `data-action` (`NV:20-21` header comment; `getTestState` selectors `NV:939-951`), `data-unplug` (`NV:935`-ish; `getTestState` `unplug.selector`).

### 3.4 Events emitted by the client

Emitted through `eventDispatcher`, each also as `<name>:<id>`: see `NL:164-180` (`_emit`) and the list in the header `NL:31-40`. Confirmed call sites:

| event | emitted at |
|---|---|
| `network_foothold_gained` (`footholdId`, `via` jack/implant/wifi, `networkId`, `sourceId`) | `NL` (plant ~`:459`, implant ~`:534`, join ~`:654`), per the doc `N` event table |
| `network_device_planted` (`jackId`, `footholdId`, `networkId`, `deviceId`) | `NL` (~`:458`) |
| `network_device_refused` (`jackId`, `reason` no_device/port_security; or `pcId` + `usb_refused`) | `NL` (~`:402-436`, `:485`); `patch-panel-minigame.js:252` |
| `network_device_unplugged` (`jackId`, `footholdId`, `endedPcIds`, `tokenExpiredPcIds?`) | `NL` (~`:593`) |
| `network_joined` (`apId`, `footholdId`, `networkId`, `already`) | `NL` (~`:652`) |
| `network_view_closed` (`footholdId`, `reason` closed / link_dropped / foothold_gone / handover / unplugged etc.) | `NL:796` (in `leave`) |
| `network_viewed` (`footholdId`, `networkId`, `hostIds`, `hostList`, `via?`) | `NV:454`, `NV:461` (`emitOnce` in `emitViewed`) |
| `network_host_opened` (`footholdId`, `hostId`, `kind`) | `NV:874` (in `act`) |

The doc's line numbers for `NL` event sites are from `docs/ACCESS_AND_NETWORKS.md:706-716` and were not all re-verified here (**unconfirmed** for the exact lines other than `NL:796`, `NV:454`, `NV:461`, `NV:874`, which were read).

### 3.5 Remote sign-in and the desktop

- `NV.act` (`NV:867-895`): for a `pc` row, `open` calls `window.openRemoteDesktop(row.id, footholdId)` (`unlock-system.js:449`), `sign-in` calls `window.openRemoteSignIn(row, footholdId)` (`unlock-system.js:351`). A held `from` route opens `openFromDesktop` (`unlock-system.js:1816`). Shares with contents open `window.startContainerMinigame(...)` (`NV:890-893`).
- `openRemoteDesktop` (`unlock-system.js:449-458`): a session with `fromPcId` and no foothold opens from its source; else `openLoginDesktop(remoteLockable(...))`.
- `openRemoteSignIn` (`unlock-system.js:351-353`) wraps `openLoginSignIn(remoteLockable(hostRow, footholdId))`.
- After a desktop closes the trip returns via `landed` and may reopen the view or reopen a `connectBack` desktop (`container-minigame.js:1233-1252`).
- The sign-in screen itself (`pc-sessions.js`) is outside this digest (**unconfirmed** detail).

### 3.6 Other client-side network code

- Patch panel: `patch-panel-minigame.js` plants through `networkLinks.interactJack` (header lines 1-9); panel rows from `patch-panel-model.js` (`chooseLayout`, `rowsOf`, `entriesByPort`, `portState`, `vlanClass`, `findJack`).
- Rogue AP console: `rogue-ap-minigame.js` (header 1-16); model `rogue-ap-model.js` (`scanRows`, `portalTemplates`, `captureLogLines`, `cloneLogText`, `logLines`). Opened by `interactions.js` for an object with `wifiTwin` (per the header of `rogue-ap-minigame.js`).
- Implant client: `apply-actions.js:445-458` calls `networkLinks.implant`.
- Keyring and `from` screens: `unlock-system.js:1815`, `container-minigame.js:1233-1252`.
- Objectives: `objectives-manager.js:290-298` reads `gainedFootholds` and `heldAt` for jack tasks (`NL:234`).
- Room sync: `core/rooms.js:1038-1039` calls `networkLinks.syncRoom` so a planted jack shows its `plantedSprite`.

---

## 4. Other minigames in the same family (purpose, params, scenarios)

**network-architecture** (`public/break_escape/js/minigames/network-architecture/network-architecture-minigame.js`, 420 lines). MG-06, Purdue-model architecture diagram (SVG). Purpose: the player reviews a topology and marks paths. Params (header `:6-27`): `title`, `reviewedVar`, `viewBox` (default `"0 0 900 572"`), `zones[]` (`id, label, y, h, fill, stroke, nodeClass, x?, width?`), `nodes[]` (`id, label, zone, x, y, w, h, paths[], desc, vuln`), `lines[]` (`from, to, type normal/boundary/legacy/hardwired, paths[]`), `attackPaths[]`, `externalOrgs[]`. Launched by `minigame-starters.js:1026-1043` and `interactions.js:1685-1686` for an object of type `network_architecture`. Scenarios using it: `scenarios/test-network-architecture/scenario.json.erb` (lines 31 and 39 use `"type": "network_architecture"`). The grep also matched `sis01_healthcare` and `sis02_energy` (**unconfirmed** whether they use this object type or only the substring).

**network-segmentation-map** (`.../network-segmentation-map/network-segmentation-map-minigame.js`, 803 lines). MG-04, a four-slot topology (external, enterprise, clinical, legacy) with rules you toggle, a SEVER button, and consequence text. Params (header `:6-25`): `title`, `severButtonLabel`, `severVar`, `rulesReviewedVar`, `auth { itsecVar, clinicalVar, resultVar, itsecLabel, clinicalLabel, claimRef }`, `zones[] { slot, label, devices[] }`, `rules[] { id, label, title, connectionType, fromSlot, toSlot, consequences[] }`, `defaultConsequences[]`, `severConsequences[]`, `modalConsequences[]`; optional `severLockedHint`. Launched by `interactions.js:1541-1551` for `sprite.scenarioData.type === "network-segmentation-map"` (uses `minigameData`). Scenarios: `scenarios/test-network-segmentation-plan/scenario.json.erb` (object at line 38, `"type": "network-segmentation-map"`), and `scenarios/sis01_healthcare/scenario.json.erb` (grep hit; **unconfirmed** line). Asset `network-segmentation-map.png` preloaded at `core/game.js:1449`.

**ble-scanner** (`public/break_escape/js/minigames/ble-scanner/ble-scanner-minigame.js`, 675 lines). A BLE scanner item. Purpose: scan nearby BLE devices (range `BLE_SCAN_RANGE = 150`, interval 200 ms, throttle 100 ms, lines `:25-27`) and select one to interact with. It is opened from an inventory item (`interactions.js:1290-1292`) and from a lock of `lockType: "ble"` that needs a held item with `type: 'ble_scanner'` (`unlock-system.js:1360-1383`). `startBleScannerMinigame(item, extraParams)` at file end (`:661-675`). Scenarios: `scenarios/test-ble-scanner/scenario.json.erb` (locks at lines 62 and 76, `"lockType": "ble"`). This is not a network-view feature and is not a host scanner. Note: the ticket asks about "scanning for hosts"; this scanner scans BLE devices only.

---

## 5. Validator, schema, dungeon graph

### 5.1 Validator

- Entry point: `check_network_model(json_data, scenario_dir)` (`scripts/validate_network.rb:43`), called from `scripts/validate_scenario.rb:8971` via `run.call('check_network_model')`.
- Helpers `err`/`warn` (`VN:49-50`) push strings prefixed `❌ ERROR: network model:` or `⚠️ WARNING: network model:`. Sections (`# ----` markers): Port security `:72`; Network references `:91`; Jacks `:102`; Patch panel `:138`; Rogue devices `:196`; Headless hosts `:260`; Wi-Fi `:278`; Links and pivot `:342`; Outages `:394`; Policies `:431`; Resources `:439`; Hosts `:538`; Implants `:642`; Information lines `:760`. Ends at `:833`.
- Representative checks (line numbers of the emitting `err.call` / `warn.call`):
  - Jack: portSecurity only on a jack (`:78`); jack not in container, profile or share (`:120`); jack not a sign-in object (`:122`); jack has no lock/trigger fields (`:127`); jack not takeable (`:129`); jack with no network (`:135`).
  - Panel: `panelOf` names a real object (`:152`); the panel lists the jack (`:154`); duplicate port or jack (`:174`, `:178`); port's jack not a networkJack (`:187`).
  - Devices: rogue device without id (`:209`); not takeable (`:211`); droppable (`:214`); requires and consumes (`:226`); warnings for jack without device (`:230`) and device without jack (`:234`).
  - Headless: not lockType login (`:267`); no network (`:271`); workstation with an owner (`:273`).
  - Wi-Fi: `wifi` must be an object (`:284`); needs `ssid` (`:287`); psk type and whitespace (`:288`, `:290`); warnings for psk under eight chars (`:300`) and psk in unseen places (`:303`, `:316`, `:319`); wifiAp without network (`:331`), without the network's wifi block (`:333`), on a login object (`:335`), on a jack (`:336`), with a lock (`:338`).
  - Links: shape (`:345`, `:350`), self-link (`:354`), unknown network (`:356`); pivot-only reachability warning (`:375`); more than 8 paths (`:390`).
  - Outages: offWhen shape (`:404`); undeclared global warning (`:409`); open share on a down network (`:426`).
  - Policies: `remote` must be allowed/blocked (`:436`).
  - Resources: contents on a non-share (`:442`); contents not a list (`:447`); sign-in object inside contents (`:480`); id clashes (`:497`); access list shape (`:508`); unknown person (`:512`); role no NPC holds (`:515`); share with access and no contents (`:564`); access list admits no account (`:580`).
  - Passwords: an NPC `creds.password` in a name, host or observations string (`:533`).
  - Hosts: sign-in PC in a locked room (`:554`); two hosts sharing one label (`:592`); physical items on a host desktop (`:601`); remote-only host under `maxAttempts` (`:629`).
  - Implants: action on a path the server does not run (`:705`); both or neither of `needsDropped`/`needsSession` (`:712`, `:714`); pc not a sign-in PC on a network (`:719`); duplicate grant (`:723`); needsSession without needsHeld (`:731`); needsHeld names no item (`:733`); needsSession on the PC it targets (`:737`); host sets consumesItem (`:741`); USB refusal warning (`:754`).
- Other validator file: `scripts/validate_scenario.rb:7779-7810` has policy and remoteScreen checks (doc N2).

### 5.2 Schema: how a new closed block is declared

- `scripts/scenario-schema.json` uses `"additionalProperties": false` for closed objects (e.g. `networks.additionalProperties` at `SCH:320-326`).
- `x-serverOnly: true` marks a key the browser never receives (`SCH:318`, `SCH:342`, `SCH:348` range). `x-servedBy` lists the routes that serve it (`SCH:318`, `SCH:342`).
- `x-ref: "network"` marks a reference to a `networks` key (`SCH:359`, `SCH:4225`, `SCH:5525`). `x-id-map: true` marks an id-keyed map in a oneOf (`SCH:327`, `SCH:5510`).
- Schema is read by `ScenarioSchema.root` (`NM:263`) and `AuthorNotes.each_live` (`NM:263`), so a new key in a closed block must be in the schema or the validator reports unknown fields (**unconfirmed** exact behaviour of an unknown key; the validator's generic check was not read).
- `test/unit/schema_walk_test.rb` exists (listed in the test index below).

### 5.3 Dungeon graph (`scripts/generate_dungeon_graph.rb`, 2415 lines)

Network logic is in `:528-760` (per `docs/ACCESS_AND_NETWORKS.md:719-726`, not all re-read here):
- A jack is a lock-like node from its room to its network node (`:528-760`); a portSecurity jack is a dead end (`:696-705`).
- A network link is a dashed undirected edge (`:85`, `undirected`).
- A pivot is a `+` gate per sign-in host on a reached network with a `pivot` edge to each linked network (doc `README:1152`).
- An outage is written into the network node label ("down while X", "(down at start)"), not as a gate (`:654-666`).
- A Wi-Fi AP is a lock-like node opened by a "Wi-Fi key" node; the key text is scrubbed (`:539-640`, `check_wifi_key_free` `:630`, `wifi_key_in?` `:584`).
- An implant is one node per PC with edges (doc `N10`).
- `docs/IDEAS_BACKLOG.md:239` says the graph does not draw links, outages, Wi-Fi or implants. The generator does draw them, so that backlog line is stale (doc).
- The helper `NetworkModel` is required by the generator (`scripts/generate_dungeon_graph.rb`, `NM` header lines 16-17).

---

## 6. Tests

### 6.1 Test files with "network" (names only, from `test/`)

Controllers (`test/controllers/break_escape/`): `network_implants_test.rb`, `network_wifi_test.rb`, `network_no_exposure_test.rb`, `network_footholds_test.rb`, `network_host_service_off_test.rb`, `network_pivot_test.rb`, `network_remote_signin_test.rb`, `network_remote_tiles_test.rb`, `network_shares_test.rb`, `network_outages_test.rb`, `network_inventory_delta_test.rb`, `network_link_names_test.rb`, `network_notes_not_live_test.rb`, `lab_physical_pentest_network_test.rb`, `start_item_answer_network_test.rb`.

Models (`test/models/break_escape/`): `network_withholding_test.rb`, `lab_physical_pentest_network_model_test.rb`.

Unit (`test/unit/`): `network_model_test.rb`.

Support (`test/support/`): `network_model_scenario.rb` (fixture builder for network tests).

Other tests that touch footholds or networks without the word in the name: `test/controllers/break_escape/network_*` (above), `declared_grants_test.rb`, `credential_login_test.rb`, `demo_access_tour_test.rb`, `flag_station_item_claim_test.rb`, `sync_end_globals_test.rb`, `captures_sync_test.rb`, `wearable_test.rb` (matches in the grep for `network|foothold`). Also `test/unit/access_leak_scanner_test.rb`, `test/unit/schema_walk_test.rb`, `test/unit/format_upgrade_test.rb`, `test/models/break_escape/credential_sessions_test.rb`, `test/models/break_escape/credential_keyring_test.rb`.

JS tests named with network: none found by `ls` (**unconfirmed**: a `grep -rl network test/` over `*.js`/`*.mjs` found `test/js/*` files that mention network in passing, e.g. `social-feed.test.mjs`, `pc-monitor-frame.test.mjs`; none named for networks).

### 6.2 Feature test scenarios

| scenario | role | pointer |
|---|---|---|
| `scenarios/test_access_networks/` | best demo of networks: 12 beats (P1 to P12), policies `hardened`, `counted`, `kiosk_locked`, `nla`; `servers_offline` outage; BadUSB at `sam_pc`; `networks` key at `scenario.json.erb:10` | `scenario.json.erb:2-11`; `PLAYTEST.md` (425 lines, headings read) |
| `scenarios/test_access_devices/` | jack, rogue device, patch panel (`panel1`, `panel_voice`) demo | doc N1, N11 |
| `scenarios/test_access_keyring/`, `test_access_sessions/`, `test_access_signin/`, `test_access_social/`, `test_access_work/`, `test_access_doors/`, `test_access_habits/`, `test_access_habits/`, `test_access_social/` | other access features that also use networks (see doc) | doc |
| `scenarios/demo_access_tour/` | tour that uses jack, remote, shares, BadUSB | doc N1, N2, N4, N10 |
| `scenarios/lab_physical_pentest/` | physical pentest lab, Wi-Fi, patch panel | `lab_physical_pentest_*` tests |
| `scenarios/test-network-architecture/`, `scenarios/test-network-segmentation-plan/`, `scenarios/test-ble-scanner/` | minigame tests (section 4) | |
| `scenarios/test-network-architecture/dungeon_graph.*`, `scenarios/test_access_networks/dungeon_graph.*` | generated graph outputs | |

Note: `test_access_networks/reports/2026-11-10_step8_runs.md` is a run report (not read).

### 6.3 Scripted playtests

- `scenarios/test_access_networks/PLAYTEST.md` (425 lines): sections "Which runs need which step" (`:13`), "Setup (each run)" (`:25`), "Harness notes for this scenario" (`:54`), "Run 0 (step 7): plant, unplug, plant again, reload" (`:93`), "The beats (P1 to P12; Runs A to C with step 8)" (`:128`). Beat headings `### P1 An open share at the keyboard` (`:137`), `P2 Plant` (`:145`), `P3 See` (`:152`), `P4 Open share from the view` (`:163`), `P5 Remote sign-in` (`:170`), `P5b` (`:186`), and later beats through P12. Line 11 says the leak check proves the browser sees networks only from `GET /network` and `GET /container`.
- Assertion style: beats name the server state they check (the file's text was only sampled by heading; **unconfirmed** how each assertion is written).
- Server-level assertions in tests: `network_no_exposure_test.rb` and `network_withholding_test.rb` check the bootstrap and `/network` answers do not leak (names only; contents **unconfirmed**).

---

## 7. Extension points and constraints

### 7.1 A new per-host field (e.g. a scan or service flag)

1. Declare it in `scripts/scenario-schema.json` in the object definition near `SCH:5525-5547` (`host`, `headless`, `networkJack` block). Use `x-serverOnly: true` if the browser must not see it (pattern at `SCH:5525`).
2. Read it through `NetworkModel` (add a helper beside `NM:46-60`) so the validator, graph and server agree (the module header `NM:12-14` says so).
3. Server row: add to `host_row` (`NA:1043-1076`) for what `/network` sends, or to `attach_network_state!`/`withhold` (`NA:21`, `NA:30-37`) for objects. A field the browser needs must be copied into the row, not the object.
4. Validator rule in `scripts/validate_network.rb` under the Hosts section (`:538`) or Headless (`:260`).
5. Client: `network-view-minigame.js` `hostAction` (`NV:215`) and `downState` (`NV:159`) for display; the test state `getTestState` `NV:932-951` lists fields for tests.
6. Keep the README and `docs/ACCESS_AND_NETWORKS.md` in step (doc says so, lines 3-5 of the doc).

### 7.2 A new server route

- Add the route in `config/routes.rb` inside the member block of games, beside the network routes (`routes.rb:50-55`), or beside `login` (`:38-42`).
- Add the action in `app/controllers/break_escape/games_controller.rb` (pattern: `network_plant` `GC:1758-1767`), with `authorize @game if defined?(Pundit)` first.
- Add it to **both** the `set_game` list (`GC:92-99`) and the `with_game_lock` around_action list (`GC:103-108`) if it writes footholds, sessions or the inventory.
- Put the logic in `app/models/break_escape/network_access.rb` (concern included by `GM:7`), returning `{ status:, body: }`.
- Add `network_*` events if the view must react (see 3.4).
- Client: `public/break_escape/js/api-client.js` (`networkPlant`, `networkUnplug` at `:177-200`) and a caller in `systems/network-links.js`.
- The policy file `app/policies/break_escape/game_policy.rb` has per-action methods (`scenario?` `:13`, `sync_state?` `:29`). A new action needs a policy method too (**unconfirmed**: not checked whether the policy is per-action or generic).

### 7.3 A new network-view row type

- Server: add a row builder beside `host_row` (`NA:1043`) and `resource_row` (`NA:1078`), and include it in `network_rows` (`NA:873-880`) or `network_blocks` (`NA:795`) so it appears in `hosts`/`networks`.
- Client, `network-view-minigame.js`:
  - `KIND_RANK` and `KIND_LABELS` / `KIND_ICONS` / `KIND_GROUPS` (`NV:127-139`) to place and label it.
  - `rows()`/`blockRows()` (the rows getter, `NV` around `:436-470`; **unconfirmed** exact line).
  - `act(row, action)` (`NV:867-895`) for its control and `_emit('network_host_opened', ...)` (`NV:874`).
  - `resourceAction` / `hostAction` (`NV:215-233`) for the button.
  - Test state `getTestState` (`NV:932-951`) for the bridge.
- Mapping of rows to desktops is `NA:1631-1658` (`mapped_shares`), only for shares.

### 7.4 Documented rules a new feature must respect

From the code and `docs/ACCESS_AND_NETWORKS.md`:
- **Server decides, browser displays.** Authority for reach, outages, footholds, sessions and inventory is server state (doc `:9-10`, doc N1 "Server enforces / client only", `NA:1111-1119` soft gate on outages because outage globals are client-synced).
- **Withheld fields.** Never send `networks`, `networkLinks`, `resources`, object `network`, `linkName`, `linkStoreIn`, or any password. Captured passwords only via `GET /capture_secrets` (`GC:1842+`). The view never shows an NPC password (`VN:533`).
- **Inventory items are server-owned.** A device must be a server item; never trust a client-forged item (doc N1, `NA:143-168`).
- **Delta answers.** Network routes answer deltas only with `delta: true` (`GC:2363-2366`, `NA:206-231`).
- **Lock on writes.** Writing routes must be in `with_game_lock` (`GC:92-108` comments).
- **Sign-in PCs are not rooms.** Nothing under a sign-in object is a room object (`NM:76-78`).
- **Jacks cannot be takeable, containers or sign-in objects** (`VN:120-129`).
- **Port security and USB policy** refuse at the server (`NA:111-119`; `usb` policy doc A10b).
- **Outage is a soft gate** (doc N7, `NA:1105-1124`).
- **Reach cap**: at most 8 link paths shown (`NM:206`), enumerated to 64 (`NM:207`).
- **Test harness copy lists**: a new static import in an engine JS module must be added to the test harness copy list (per project memory; **unconfirmed** exact file: `bin/test-js` runs plain `node`).
- **Sync state**: network state is not a sync section (2.4); changes go as server answers, not via `PUT /sync_state`.

### 7.5 Things a planner should know are already in code (not planned)

- `scanRows` exists only for the rogue AP's Recon (client-side, from authored data: `rogue-ap-model.js`). There is no server "scan" route for hosts or services today (verified by the route list `routes.rb:27-55`).
- No "weakness" field on a service or host exists in the schema (`SCH` grep for `vuln` returned nothing in the network blocks; the `vuln` field appears only in the network-architecture params `minigame` docs `network-architecture-minigame.js:17`).
- Cards that grant a session: nearest existing mechanisms are the keyring (`credentials`, `GET /keyring`, `GC:1862`) and `grant_foothold` with `needsSession` (`NM:266`, `SCH:3949`). A card item with `cloneable`/`card_id` is covered by `POST /clone_card` (`routes.rb:42`).

---

## 8. Unconfirmed list

- Exact line numbers of most `NL` event emitters other than `NL:164-180`, `NL:796`.
- Whether the sign-in screen (`pc-sessions.js`) is covered by network tests.
- Exact assertion syntax in `PLAYTEST.md` (only headings read).
- Whether `sis01_healthcare` and `sis02_energy` use `network_architecture` as an object type (grep matched).
- How an unknown key inside a closed schema block is reported by the validator.
- Whether the policy class is per-action (`game_policy.rb`).
- The `NV` rows-getter line number.
- Whether `test/js` has any network-named JS test (none found by name).
