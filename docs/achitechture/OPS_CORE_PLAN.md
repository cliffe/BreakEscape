# Ops core plan: scan, findings and technique cards (S1 to S3)

Status: first draft, incomplete (2026-11-19). Sections 1 to 8 and 13 to 15 are drafted. Sections 9
to 12 are outlines to be filled. Planning only; nothing here is built. Base: branch
`docs/ops-layer-plan`. Feature ids on landing: N13 (scan), N14 (findings), N15 (technique cards).

This plan is standalone. It adds three features to the built network features (N1 to N12 in
`docs/ACCESS_AND_NETWORKS.md`), each with its own server routes. Line numbers were read on
2026-11-19 and will drift. A pointer marked (unverified) comes from a digest and was not opened.

Short forms: `NM` = `lib/break_escape/network_model.rb`; `NA` =
`app/models/break_escape/network_access.rb`; `GM` = `app/models/break_escape/game.rb`; `GC` =
`app/controllers/break_escape/games_controller.rb`; `NV` =
`public/break_escape/js/minigames/network-view/network-view-minigame.js`; `NL` =
`public/break_escape/js/systems/network-links.js`.

## 0. Shapes other plans rely on

These names are fixed for the other five ops plans. Ids match `^[a-z][a-z0-9_]{0,63}$`.

| Thing | Where it is declared | Shape | Id other plans use |
|---|---|---|---|
| Host with a sign-in | a room object with `lockType: "login"` (as today), which may now carry `services[]` | unchanged, plus `services` | the object's `id` |
| Host with no sign-in | top-level `hosts.<hostId>` (new, server-only) | `{ name, network, sprite?, offWhen?, services[] }` | `<hostId>`, in one id space with objects and resources |
| Service | `services[]` on either kind of host | `{ name, label?, port, product, version, weaknesses[]?, decoys[]? }`; `name` is unique on its host and is the service's id | `<hostId>.<serviceName>` |
| Weakness | `services[].weaknesses[]` | `{ id, class, severity, summary?, needs?, grants, fixedIf? }` | finding id `<hostId>.<serviceName>.<weaknessId>` |
| Decoy | `services[].decoys[]` | `{ id, class, severity, summary?, falseBecause }` | finding id, same form |
| Finding | not authored; a server record made by a check | `{ id, hostId, service, class, severity, summary, status }`, `status` is `unconfirmed`, `confirmed` or `false`; a confirmed finding also carries `needs[]` | finding id |
| Technique | top-level `techniques.<techniqueId>` (new, server-only) | `{ name, summary?, worksOn: { class, product?, versions? } }` | `<techniqueId>` |
| Technique card | an inventory item with `technique: "<techniqueId>"` | any tray item type; holding it is having the card | the item's `id` |

Enumerations:

- `class`: `default_creds`, `unpatched`, `misconfig`, `weak_auth`, `cleartext`.
- `severity`: `low`, `medium`, `high`.
- `needs` (all must hold; reach to the host is always needed and is not written): `credential:
  "<credentialId>"` (in the keyring), `item: "<itemType or itemId>"` (held, not forged), `session:
  "user" | "admin"` (a session already held on this host, for a step up), `global: <requireGlobal
  form>`.
- `grants` (exactly one): `{ "session": { "account": "<npcId>", "access": "user" | "admin" } }`,
  only on a host with a sign-in; or `{ "credential": "<credentialId>" }`, on any host.

A session granted by a technique is an ordinary entry in `player_state.sessions[<pcId>]` with `via:
"technique"`, the `foothold` it came through, `access` (`user` or `admin`) and `technique` (the
finding id). S3 only records `access`; S5a owns what it means. A password, claim or credential
session has no `access` key, and S5a decides how to read that.

Server state added (all server-owned, none a sync section): `opsDiscovered`, `opsFindings`,
`opsUsed` (section 8). Routes added: `POST /network/scan`, `/network/check`, `/network/confirm`,
`/network/technique` (section 6). `GET /network` gains fields on rows and never a new route for
reading. S6 renders the same answers.

## 1. What this adds and why, in play

**Today.** Planting a device, joining Wi-Fi or implanting a PC gives a foothold, and the network
view then lists every sign-in host and share on each network in reach. The only way onto a host is
a password, an unlocked screen or a keyring credential. The network itself is never a puzzle.

**The loop this adds.** On a network the scenario marks for discovery, the view opens empty.

1. **Sweep** (S1). The player presses Sweep on a network block. Host rows appear: PCs, and now
   devices with no sign-in (a printer, a camera recorder, a door controller). A row shows a name
   and a sprite and nothing else.
2. **Scan a host** (S1). Scan on a host row reveals its service tiles: name, port, product and
   version, for example "files · 445 · Brackley ShareServe 3.1". The products are invented. The
   player learns that a host is a set of listening services and that the version matters.
3. **Check a service** (S2). Check on a tile lists findings, each with a class and a severity and
   marked unconfirmed. Some are real, and a scenario can add decoys.
4. **Confirm a finding** (S2). Confirm settles it. A real one becomes confirmed and now shows what
   it needs, as a short list with a tick or a cross against each line ("An account on this host:
   no"). A decoy becomes false and shows the authored reason ("The banner is old; the service was
   patched"). This is where the player learns preconditions: the finding says what is missing
   before any card is tried.
5. **Use a technique card** (S3). Cards are things the player picks up in the world: a page in a
   contractor's folder, a file on a share, a gift from an NPC. A card's face says what it works
   on: a class, and sometimes a product and versions. The player drags a card to a confirmed
   finding, or selects the finding and presses Use on a card. If the card fits and every need is
   met, the finding's grant happens: a remote desktop opens on that host as the named account, or
   a credential lands in the keyring.

**Why it is a puzzle and not trial and error.** Everything needed to choose is on screen before
the attempt: the tile gives product and version, the finding gives class and needs, the card gives
what it works on. Picking is reading and matching three facts. The work is in the needs: a missing
credential sends the player to a person, a missing item sends them to a room, a missing session
sends them to another host first. Decoys cost a confirm step, so checking before acting is the
habit that pays.

**What failure tells the player.** One reason, the first that applies, in a fixed order: confirm
the finding first; this finding was a false positive; this card is for another class; another
product; another version; the service has been fixed; then the first unmet need by name. A refusal
changes nothing and costs nothing in this plan (question 4). Each attempt is a log row.

**How it joins the rest.** A granted session behaves like a remote sign-in session: it pivots
(N6), maps shares (N4), counts for an implant that needs a session (N10), and ends when the
foothold is unplugged (N5). A granted credential is a keyring entry (A15). Social engineering and
physical work feed the needs, and network work feeds back credentials and sessions.

## 2. What the code does today

| Area | Today | Where |
|---|---|---|
| What a host is | A room object with `lockType: "login"`; `headless: true` for one with no screen. No `hosts` key, no services | `NM:46-56`, `NM:115-120` |
| Rows of a network | Every sign-in host on the network, then every resource not down, sorted by id. Nothing is hidden on a reached network | `NA:873-879` |
| Host row | `id, kind: 'pc', name, host, sprite, headless`, then `remoteSignIn` and `session`, or `responding: false` and `heldAs` when off | `NA:1043-1076` |
| Resource row | `id, kind, name, host, open`, `listed`, `observations`; contents never | `NA:1078-1085` |
| The view answer | Per foothold: flat `hosts` for its own network when up, and `networks` blocks, one per network in reach plus greyed blocks for held sessions out of reach | `NA:746-774`, `NA:795-828` |
| Withholding | `networks`, `networkLinks`, `resources` deleted from the bootstrap; `network`, `linkName`, `linkStoreIn` deleted from objects. Named lists, no generic `x-serverOnly` filter | `NA:18-26`; D5b 1.6 |
| Reach | `player_reach(foothold)`: own network if up, then linked networks through held, unlocked, responding session hosts | `NA:1201-1283` |
| Host reachable | Target must be a sign-in object on a network in `player_reach` | `NA:1477-1483` |
| Unplug | Ends every session whose `foothold` is this one, then prunes sessions no foothold structurally reaches | `NA:290-321`, `NA:410-415`, `NA:1446-1472` |
| Outage, host off | Session kept; desktop and scoped requests refused while the route or host is down; soft gate because the global is client-synced | `NA:981-986`, `NA:1125-1133`, `NA:1158-1188` |
| Desktop request | Through a foothold: host reachable, `remote` not blocked, host on, session not a claim, relay or `from` | `NA:1495-1518` |
| Shares, the nearest "served once earned" pattern | Contents only from `GET /container` after `resource_admits_player?`; an unadmitted share answers as an unknown id | `NA:1580-1625`; `GC:626-668` (unverified) |
| Sessions | `player_state.sessions[pcId] = { id: npcId, via }` plus `foothold`, `from`, `credential`, `relay`. No privilege field | `GM:4388` (body unverified; D2 2.6) |
| Keyring | Server-only `credentials` registry; an entry is served by `GET /keyring` once its one proof holds. Proof kinds `session, planted, dropped, held, foothold` | `credential_model.rb:21-36`, `credential_keyring.rb:21-36` (unverified; D2 1.4, 2.9) |
| Routes | `GET /network`, `POST /network/plant|unplug|implant|join`; writers are in the `set_game` and `with_game_lock` lists | `config/routes.rb:51-55`; `GC:27`, `GC:103` |
| Scanning | None for hosts. `scanRows` in the rogue AP console is client-side Wi-Fi recon; the BLE scanner is unrelated | D1 7.5 (unverified) |

Already doing part of the job, and reused: the network view (rows, blocks, 5 s refetch), the
remote desktop and its route checks, `end_sessions_through!` and the prune, the keyring's
registry-plus-proof model, the item field that ties a tray item to a registry entry (`credential`
today, `technique` here), and `offWhen` in the requireGlobal form (the model for `fixedIf`).

## 3. Build stages

| Stage | Adds | Ends playable when | Size |
|---|---|---|---|
| S1 (N13) | `hosts` map, `services[]`, `networks.<id>.discovery`, `POST /network/scan`, host and service rows in the view | `test_ops_scan`: a discovery network opens empty; a sweep lists its hosts; a host scan lists services; a pivot then lets a second network be swept | M |
| S2 (N14) | `weaknesses[]`, `decoys[]`, `fixedIf`, `POST /network/check` and `/confirm`, the findings panel | `test_ops_findings`: findings appear only after a check; a decoy confirms false; a real one confirms and lists its needs; a fixed weakness yields no finding | M |
| S3 (N15) | `techniques`, the item field `technique`, `POST /network/technique`, `via: "technique"` sessions, the keyring proof kind `technique`, the techniques panel | `test_ops_access`: a wrong card is refused with its reason; the right card with needs met opens the desktop or adds the credential; unplugging ends the session | L |

S1 ships with `weaknesses`, `decoys` and `techniques` reserved: the schema declares them and the
validator errors if a scenario uses one before its stage lands. Each later stage removes only its
own reservation.

## 4. Scenario fields

### 4.1 S1

```json
"networks": {
  "office_lan": { "name": "Office LAN", "discovery": "scan" }
},
"hosts": {
  "print01": {
    "name": "Second floor printer", "network": "office_lan", "sprite": "printer",
    "services": [
      { "name": "print", "port": 9100, "product": "Inkwell JetServe", "version": "1.4" },
      { "name": "admin_page", "label": "Admin page", "port": 80, "product": "Inkwell WebPanel", "version": "2.0" }
    ]
  }
}
```

and on a sign-in object in a room:

```json
{ "id": "files01", "type": "pc", "lockType": "login", "headless": true, "host": "FILES01",
  "network": "office_lan",
  "services": [ { "name": "files", "port": 445, "product": "Brackley ShareServe", "version": "3.1" } ] }
```

- `networks.<id>.discovery`: `"open"` (default, and the meaning of an absent key: every row is
  listed as today) or `"scan"` (rows are listed only once discovered). Per network, so one
  scenario can mix both.
- `hosts.<id>`: closed block, server-only. `name` and `network` required. `offWhen` as on an
  object. No `contents`, no lock, no room: a host here is never clicked in the world. If it should
  also be a prop in a room, the prop is an ordinary object and the two are not linked by the
  engine.
- `services[]`: at most 8 per host. `name` is an id, unique on the host. `port` is 1 to 65535,
  display only. `product` and `version` are plain text up to 40 characters. `services` on a room
  object is added to `WITHHELD_OBJECT_FIELDS` so it never rides on room data.
- A scenario has at most 64 hosts carrying services.

**Why a top-level `hosts` map for hosts with no sign-in.** The alternatives were a room object
with a new flag, or a `resources` entry with `kind: "host"`. A room object needs a position, a
sprite in the world and interaction rules, none of which a camera recorder on a network needs,
and every room object's fields must be stripped by name. A resource is something a session opens
(a share with contents and an access list), served by `GET /container`; giving it services would
give `resources` two meanings. A server-only map beside `networks` and `resources` is deleted
from the bootstrap by one more name in `WITHHELD_SCENARIO_KEYS`, and reads through one new
`NetworkModel` helper. Services on a sign-in object stay on the object, because that is where an
author already describes that PC.

### 4.2 S2

```json
{ "name": "admin_page", "port": 80, "product": "Inkwell WebPanel", "version": "2.0",
  "weaknesses": [
    { "id": "factory_login", "class": "default_creds", "severity": "high",
      "summary": "The admin page still accepts the factory account.",
      "needs": { "item": "printer_manual" },
      "grants": { "credential": "print_admin" },
      "fixedIf": "printer_reset_done" }
  ],
  "decoys": [
    { "id": "old_banner", "class": "unpatched", "severity": "medium",
      "summary": "The page reports an old build number.",
      "falseBecause": "The build number is cosmetic. The panel was updated last month." }
  ] }
```

- At most 4 weaknesses and 4 decoys per service. Ids are unique across both lists of a service.
- `summary` and `falseBecause` are plain text, up to 200 characters, written in game design terms:
  what is wrong, never how to exploit it. With no `summary` the view shows a line per class from
  an engine table.
- `fixedIf` takes a bare global name or the requireGlobal map, read by the same helper as
  `offWhen`. While it holds, a check does not produce the finding, and a finding already held
  shows "Fixed" and refuses a card.
- `needs.session` is allowed only where `grants.session` is on the same host (a step up).

### 4.3 S3

```json
"techniques": {
  "factory_accounts": { "name": "Factory accounts",
    "summary": "Devices often ship with a published account that nobody changes.",
    "worksOn": { "class": "default_creds" } },
  "shareserve_3x": { "name": "ShareServe 3.x service flaw",
    "worksOn": { "class": "unpatched", "product": "Brackley ShareServe", "versions": ["3.0", "3.1"] } }
}
```

and a card, anywhere an item can be:

```json
{ "id": "card_factory", "type": "technique_card", "name": "Field note: factory accounts",
  "technique": "factory_accounts", "takeable": true }
```

- `worksOn.class` required. `product` must equal a service's `product` exactly; `versions` is an
  explicit list of exact strings. There is no version comparison, so no ordering rules to explain
  or get wrong.
- `techniques` holds at most 32 entries. One technique may be carried by several items; a
  weakness may be matched by several techniques.
- A grant of a credential names a `credentials.<id>` entry whose `proof` is `{ "technique":
  "<findingId>" }` (new proof kind). The validator requires the two to name each other.
- A grant of a session names an `account` (an NPC with `creds`) that the host's `access` list
  admits.

## 5. Engine behaviour

### 5.1 Model (shared by server, validator, graph): `NetworkModel`

New helpers, plain Ruby: `hosts(data)` (the map); `discovery?(data, network_id)`;
`hosts_on(network_id, data)` returning, sorted by id, one record per host of either kind `{ id:,
kind: 'pc' | 'device', object:, network:, services: }`; `services_of(host)`; `weaknesses(data)`
and `decoys(data)` yielding each with its host, service and finding id; `techniques(data)`;
`technique_matches?(technique, service, weakness)` (class equal, product equal when given, version
in list when given); `technique_items(data)` (every item carrying `technique`, with its home, found
the way `rogue_device_definitions` finds devices, `NM:138`).

### 5.2 Server, S1

- `network_rows` (`NA:873`): on an open network, as today plus `device` rows. On a discovery
  network, nothing until the network is in `opsDiscovered.networks`; then host rows and resource
  rows. A host row gains `scanned: true` and `services: [{ name, label, port, product, version }]`
  only when the host id is in `opsDiscovered.hosts`.
- A device row is `{ id, kind: 'device', name, sprite, responding? }`.
- **Enforced, not cosmetic.** On a discovery network, a remote sign-in, a remote account-tile
  request and a remote desktop request for a host not yet in a swept network are refused as
  unreachable, the same answer as a host out of reach. The record is server-owned, so the scan
  cannot be skipped by a client that knows a PC id from a room. Keyboard sign-in is untouched.
- A sweep needs the network in `player_reach(foothold)`. A host scan needs the host's network
  swept and in reach, and the host responding.

### 5.3 Server, S2

- A check needs the host scanned and reachable. It adds an `unconfirmed` entry for each weakness
  not fixed and each decoy of that service, and answers those findings. Nothing tells a real one
  from a decoy until confirm: the answer builds both from the same fields in id order.
- A confirm sets `confirmed` or `false`. The confirmed answer adds `needs`, each as `{ kind, label,
  met }`. `label` comes from the scenario object named (a credential's label, an item's name);
  `met` is computed on each `GET /network`.
- Findings ride on the host row: `findings: [...]` beside `services`.

### 5.4 Server, S3

`use_technique!(foothold_id, finding_id, technique_item_id)`, checks in order: the finding exists
in `opsFindings` (else 404, as for an invented id); the host is reachable through the foothold and
responding; the item is held, not forged, and carries a technique in the registry; status is
`confirmed` (`not_confirmed`, `false_positive`); `fixedIf` does not hold (`fixed`); the match
(`wrong_class`, `wrong_product`, `wrong_version`); each need in the order credential, item,
session, global (`need_unmet` with `need: { kind, label }`). Then the grant:

- **Session.** `start_login_session!(pc, npc, 'technique', foothold: foothold_id)` with `access`
  and `technique` added to the record, and the answer `login_session_answer` gives for a foothold
  session, so the client opens the desktop by the path it uses after a remote sign-in.
- **Credential.** The finding id is added to `opsUsed`; the keyring's proof check for `technique`
  reads that list; the answer carries `keyringChanged: true` and the client refetches `GET
  /keyring`.

Both add the finding id to `opsUsed`. A repeat use answers `already: true` with the same fields.

**How a technique session differs from a password session.**

| Aspect | Password session through a foothold | Technique session |
|---|---|---|
| Record | `{ id, via: 'password', foothold }` | `{ id, via: 'technique', foothold, access, technique }` |
| Lockout on that account at that PC | refused | not consulted: no sign-in is attempted (question 5) |
| Policy `remote: "blocked"` | refused | not consulted: the way in is the service, not remote sign-in (question 5) |
| Policy `accepts`, MFA (S8) | apply | do not apply; S8 states this from its side |
| Lock the session | allowed | refused: the player holds no password to return with |
| Settles at the keyboard (drops `foothold`) | yes | no, as a credential session does not (`NA:1556-1565`) |
| Pivots, maps shares, counts for `needsSession` | yes | yes |
| Unplug the foothold (N5) | ends | ends, by the same `end_sessions_through!` |
| Pivot lost | pruned | pruned, same loop |
| Outage or host off (N7) | kept, refused while down, works again after | the same |
| `fixedIf` becomes true afterwards | not applicable | kept: the player is already in. A new use is refused |
| Reload | kept | kept |

`desktop_request_allowed?` gains one clause so that a held technique session opens through its
foothold on a host whose policy blocks remote sign-in. Everything else in the table is existing
behaviour, because the record carries `foothold`.

### 5.5 Client

- `network-view-minigame.js`: a discovery block with no rows shows Sweep; a host row not scanned
  shows Scan; a scanned row expands to service tiles; a tile shows Check, then its findings; a
  finding shows Confirm, then its status and needs. A Techniques panel lists the held cards with
  name, summary and works-on line, read from the held items and the `techniques` the server sends
  for them. Select a finding, then a card, then Use. Pixel-art rules apply: 2px borders, pixel
  fonts, X closes, all scenario and server text set with `textContent`.
- A new pure module `network-view/ops-model.js` holds row merging, the works-on line, need labels
  and refusal texts, for node tests. It goes on every test harness copy list.
- `api-client.js`: `networkScan`, `networkCheck`, `networkConfirm`, `networkTechnique`.
- Events through `eventDispatcher`, each also as `<name>:<id>`: `network_swept`
  (`networkId`), `network_host_scanned` (`hostId`), `network_service_checked` (`hostId`,
  `service`), `network_finding_confirmed` (`findingId`, `status`), `network_technique_used`
  (`findingId`, `techniqueId`, `grant`), `network_technique_refused` (`findingId`, `reason`). A
  scenario hangs objectives and NPC lines on these; NPC lines stay in scenario files.

### 5.6 Determinism

No rolls anywhere. Every answer is a function of the scenario and server state. Rows, services,
findings and needs are in id order.

## 6. Server routes

All four are `POST`, take `delta: true`, are in the `set_game` list and in `with_game_lock`, and
live in a new concern `app/models/break_escape/network_ops.rb`. 404 unknown, 403 out of reach,
422 a refusal the player caused. Every route starts with: the foothold is held (404), then the
target exists (404).

| Route | Params | Checks in order | Writes and answer |
|---|---|---|---|
| `/network/scan` | `foothold`, and one of `network_id`, `host_id` | network in reach (403 `unreachable`); for a sweep: the network is a discovery network (422 `not_needed`); for a host: its network swept or open (404), host responding (403 `not_responding`) | adds to `opsDiscovered`; answers `{ success, network: { id, hosts: [rows] } }` or `{ success, host: <row with services> }`; `already: true` on a repeat, same fields |
| `/network/check` | `foothold`, `host_id`, `service` | host scanned (404), reachable, responding | adds findings; answers `{ success, hostId, service, findings: [...] }` |
| `/network/confirm` | `foothold`, `finding_id` | finding held (404), host reachable, responding | sets status; answers `{ success, finding }` |
| `/network/technique` | `foothold`, `finding_id`, `item_id` | section 5.4 | section 5.4; refusals are 422 `{ success: false, reason, need? }` |

A host on an open network counts as discovered and its network as swept, so `/check` works there
after a host scan; the host scan is the one step an open network still needs.

## 7. What reaches the browser, and what never does

| Data | Sent | When |
|---|---|---|
| `hosts`, `techniques` (top level), `services` on an object | never in the bootstrap or room data | deleted by name with `networks` and `network` |
| That a discovery network has hosts, and how many | never before a sweep | the block arrives with `hosts: []` and `swept: false` |
| A host's `id`, `name`, `sprite`, kind | after its network is swept | `GET /network`, the sweep answer |
| A service's `name`, `label`, `port`, `product`, `version` | after the host is scanned | `GET /network`, the scan answer |
| That a service has weaknesses or decoys, and how many | never before a check | |
| A finding's `class`, `severity`, `summary` | after the check | check answer, `GET /network` |
| Whether a finding is real | after the confirm | |
| `falseBecause` | after the confirm, for a decoy | |
| `needs` (kind, label, met) | after the confirm, for a real finding | a need's `label` is a name the scenario already shows elsewhere; never a password, a credential's secret or a global's name |
| `grants` | never; the player learns it by getting it | the session or keyring answer |
| `fixedIf` and its global | never; only "Fixed" on a held finding | |
| A technique's `name`, `summary`, `worksOn` | only for techniques whose card item the player holds | `GET /network`, top-level `techniques: {}` |
| Weakness ids | inside finding ids, after the check | ids are author-chosen; the validator warns when a weakness id or a decoy id contains words such as "decoy", "fake" or "real" |

No-exposure tests: the bootstrap and every room answer contain no `hosts`, `techniques` or
`services` key and none of their strings; `GET /network` before a sweep names no host of a
discovery network; before a host scan names no product or version; before a check no class or
summary; before a confirm nothing differs between a decoy and a real finding except authored text;
a technique not held is never named. The leak scanner gains a collector for these strings, staged
by what has been earned.

## 8. State and saved games

Three keys in `ACCESS_STATE_DEFAULTS`, all written only by the routes in section 6, never read from
a sync body, never sent whole.

| Key | Shape | Bound | Sent |
|---|---|---|---|
| `opsDiscovered` | `{ "networks": [id], "hosts": [id] }` | networks in the scenario; 64 hosts | not sent; it decides which rows `GET /network` builds |
| `opsFindings` | `{ "<findingId>": "u" | "c" | "f" }` | 64 hosts x 8 services x 8 entries in theory; the validator caps a scenario at 128 weaknesses plus decoys | not sent; findings ride on rows |
| `opsUsed` | `[findingId]` | number of weaknesses | not sent |

Each route answers only the rows or the finding it changed. `GET /network` is the one whole read,
as today, on the view's existing refetch; its size grows with what the player has discovered and
is bounded by the caps above. The plan measures that answer for `test_ops_access` at full
discovery in the node test and the live proof. Nothing here is a client global, and no existing
sync section changes.

Reload: all three keys persist, so the view returns as it was. A reset drops them with the other
access records. A game saved before this lands reads each as empty; with no `discovery` network
and no services in its scenario copy, nothing changes for it. Sessions with `via: "technique"`
persist like any foothold session.

## 9. Validator, schema and dungeon graph

To be completed after reading `scripts/validate_network.rb`, the object and `resources` blocks of
`scripts/scenario-schema.json` and `scripts/generate_dungeon_graph.rb` (none opened for this
draft). Intended content:

- **Schema.** `hosts` and `techniques` as closed, `x-serverOnly` id maps with `x-servedBy: GET
  /network`; `services` on the object definition, `x-serverOnly`; `discovery` on a network;
  `technique` on an item; `credentials.<id>.proof.technique`. Each description names its reader.
- **Validator errors.** Id clash between a `hosts` key, an object id and a resource id; unknown
  network; duplicate service name on a host; enum values; `grants` with both or neither kind;
  `grants.session` on a `hosts` entry; account that the host does not admit; `grants.credential`
  and the credential's `proof.technique` not naming each other; a weakness no technique matches;
  a technique no item carries; a technique item no player route reaches; a need naming nothing;
  `needs.session` without `grants.session`; caps; `fixedIf` global undeclared.
- **Validator warnings.** A weakness on a discovery network no foothold reaches; `fixedIf` as the
  only thing protecting a secret (it is a soft gate, like an outage); telltale ids (section 7);
  a product or version string that matches a list of real product names kept in the validator.
- **Dungeon graph.** A chain through hosts must read as a chain. Each weakness is a lock-like node
  labelled host, service, class and severity, entered from its host's network node (through the
  jack, Wi-Fi or pivot nodes already drawn). Edges into it: one from each technique card that
  matches (a key-like node at the card item's home), and one from each need (the credential's
  node, the item's node, the session node of the same host). Edges out: to the host's session
  node, which is the node a password sign-in already leads to, so pivots and shares beyond it are
  shared; or to the credential's keyring node. A discovery network's node is labelled "(scan)". A
  `fixedIf` is written in the node label, as outages are. Decoys are not drawn. The lock and key
  diff treats a card as a key and a weakness as a lock.

## 10. Effect on existing scenarios

None intended. `discovery` absent means open, so `network_rows` is unchanged; no scenario has
`hosts`, `services` or `techniques`; the four routes answer 404 where nothing is declared; the
three state keys default empty. The check: a test builds `GET /network`, the bootstrap and one room
answer for `test_access_networks` and `lab_physical_pentest` before and after and compares them
byte for byte against fixtures; the validator output for every scenario is unchanged; the Rails and
node suites pass unmodified. To be completed with the list of scenarios to rerun.

## 11. Tests

Outline, to be expanded into beat tables per stage:

- **Unit** (`test/unit/network_model_test.rb`): `hosts_on`, `technique_matches?`, finding ids,
  caps.
- **Controller** (`test/controllers/break_escape/`): `network_scan_test.rb`,
  `network_findings_test.rb`, `network_technique_test.rb`, `network_ops_no_exposure_test.rb`. Each
  refusal in section 6, each row of the table in 5.4, `already` answers carrying the same fields,
  a forged card item refused, a hostile sync body that sets `opsUsed` ignored.
- **Node** (`test/js/`): `ops-model.test.mjs`, `network-view-ops.test.mjs`, a validator test per
  stage, a dungeon graph test.
- **Feature scenarios**: `test_ops_scan`, `test_ops_findings`, `test_ops_access`, each with a
  `PLAYTEST.md` of numbered beats driven through `window.__test`, each beat stating what the
  browser received and what the server recorded.
- **Live proof** on the real path in a headless browser against a keyless server, for each stage.

## 12. Build steps and shared files

To be completed. Shared files other ops plans also touch: `games_controller.rb` (the two action
lists, a known merge conflict point), `config/routes.rb`, `game.rb` (`ACCESS_STATE_DEFAULTS`,
`start_login_session!`), `network_access.rb`, `network-view-minigame.js`, `api-client.js`,
`scripts/scenario-schema.json`, `scripts/validate_network.rb`,
`scripts/generate_dungeon_graph.rb`, `credential_model.rb`, `docs/ACCESS_AND_NETWORKS.md`,
`README_scenario_design.md`.

## 13. Log rows this feature writes

| Event | Who | Where | When | Stage |
|---|---|---|---|---|
| `network_swept` | player | network id, foothold id | sweep succeeds (first time only) | S1 |
| `host_scanned` | player | host id, foothold id | host scan succeeds (first time only) | S1 |
| `service_checked` | player | host id, service name | check succeeds (first time only) | S2 |
| `finding_confirmed` | player | finding id, status | confirm | S2 |
| `technique_refused` | player | finding id, technique id, reason | every refused use | S3 |
| `technique_used` | player, as account or for credential | finding id, technique id, host id | first successful use | S3 |

## 14. Cross-plan requests

1. **S5a (privilege).** A technique session carries `access`; other sessions carry none. S5a
   decides the level of a password, claim or credential session, and should not require S3 to
   write `access` on those.
2. **S5a.** A step up from user to admin is a weakness with `needs.session: "user"` and
   `grants.session.access: "admin"` on the same host; using it replaces the record in place and
   keeps `foothold`. S5a should confirm it wants no other escalation route.
3. **S5c (account kinds) and S8 (MFA).** A technique session attempts no sign-in, so lockouts,
   `accepts`, account kind checks and the extra sign-in step do not run for it. Both plans should
   say so from their side.
4. **S6 (skin).** The four routes and the `GET /network` fields in sections 5 to 7 are the whole
   surface. The refusal `reason` values are fixed strings the second renderer can map.
5. **S7 (hashes).** `grants` has two kinds today. If a weakness should yield a hash, S7 asks for a
   third kind here; this plan does not add it.
6. **S9 (log rows).** The helper must accept a row with no NPC actor and be callable inside
   `with_game_lock` without a second save.
7. **All.** `hosts.<id>` shares one id space with objects and resources. A plan that adds another
   top-level map of things on a network should join it.

## 15. Open questions for the user

Each has a recommendation, and the plan is written to it.

1. **Where a host with no sign-in is declared.** (a) A top-level `hosts` map, with services for
   sign-in PCs staying on the object; (b) every host's services in the `hosts` map, keyed by the
   object id for a PC; (c) a `resources` entry of kind `host`. Recommend (a): authors describe a
   PC where it already is, and `resources` keeps one meaning.
2. **Is discovery enforced or only a display.** (a) Enforced: on a discovery network a host not
   yet swept refuses remote sign-in; (b) display only. Recommend (a), so the scan is a real step.
3. **What a technique card is.** (a) A tray item tied to a `techniques` registry, shown in a panel
   of the view; (b) a server-computed collection like the keyring, earned by proofs; (c) a fixed
   list always available. Recommend (a): cards arrive by every route items already use (rooms,
   containers, NPCs, shares), which is what ties them to social and physical play. If the tray
   gets crowded, a holder item is a later addition.
4. **Does a wrong card cost anything.** (a) Nothing, but it is logged; (b) a count per host that
   locks the service after N. Recommend (a) for now; the parked defence work can make noise
   matter.
5. **Does a technique session ignore `remote: "blocked"` and account lockouts.** (a) Yes to both;
   (b) honour both. Recommend (a): turning off remote sign-in does not fix a weak service, and
   that is worth teaching.
6. **Game time.** Should a sweep, scan, check or confirm cost game minutes? No server clock is
   assumed here. Recommend no cost in S1 to S3, revisited with the parked patch-window work.
7. **Does a sweep need a tool.** (a) Any foothold can sweep; (b) the scenario may require a held
   item. Recommend (a) now, with (b) as a later `scanNeeds` field if a mission wants it.
8. **Does a technique session count as "signed in" for capture proofs and tasks** (written to
   `signedInPcs`). Recommend yes, so chains built on a session work the same however it was
   gained. This needs `start_login_session!` read before it is settled.
