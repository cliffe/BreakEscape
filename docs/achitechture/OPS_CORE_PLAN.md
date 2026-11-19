# Ops core plan: scan, findings and technique cards (S1 to S3)

Planning only; nothing here is built. Base: branch `docs/ops-layer-plan`. Feature ids on landing:
N13 (scan), N14 (findings), N15 (technique cards).

This plan is standalone. It adds three features to the built network features (N1 to N12 in
`docs/ACCESS_AND_NETWORKS.md`), each with its own server routes. Every code pointer was read in the
code on 2026-11-19; line numbers will drift.

Short forms: `NM` = `lib/break_escape/network_model.rb`; `NA` =
`app/models/break_escape/network_access.rb`; `GM` = `app/models/break_escape/game.rb`; `GC` =
`app/controllers/break_escape/games_controller.rb`; `CM` = `lib/break_escape/credential_model.rb`;
`CK` = `app/models/break_escape/credential_keyring.rb`; `NV` =
`public/break_escape/js/minigames/network-view/network-view-minigame.js`; `US` =
`public/break_escape/js/systems/unlock-system.js`; `VN` = `scripts/validate_network.rb`; `VS` =
`scripts/validate_scenario.rb`; `DG` = `scripts/generate_dungeon_graph.rb`; `SC` =
`scripts/scenario-schema.json`.

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
  only on a host with a sign-in; or `{ "credential": "<credentialId>" }`, on any host. In S3 the
  credential must be of kind `saved_connection` (section 4.3).

A session granted by a technique is an ordinary entry in `player_state.sessions[<pcId>]` with `via:
"technique"`, the `foothold` it came through, `access` (`user` or `admin`) and `technique` (the
finding id). S3 only records `access`; S5a owns what it means. A password, claim or credential
session has no `access` key, and S5a decides how to read that. A PC holds one session at a time
(`GM:4388-4417`), so a technique session replaces whatever session the player held there, as any
new sign-in does.

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
| Desktop request | Needs a session there first (`session_identity`, else `no_session`). Then, through a foothold: host reachable, `remote` not blocked, host on, session not a claim, relay or `from`. The check does not ask which foothold the session came through | `GC:3145-3165`; `NA:1495-1518` |
| Remote sign-in, tiles, credential sign-in, keyring routes | Each asks `host_reachable_through?(foothold, pc)` first, then host on, then `remote_blocked?` | `GM:3464-3472`; `NA:911-930`; `credential_login.rb:201`, `:238`; `CK:301`, `:400`, `:450` |
| Sign-in from a held desktop (`from`) | Judged by `from_route_refusal`, which does not call `host_reachable_through?` | `NA:1349-1370` |
| Host row and a blocked host | `host_row` lists a held session only when `remote` is not blocked; the client's `hostAction` answers `off` for `remoteSignIn: false` before it looks at the session | `NA:1043-1076`; `NV:215-222` |
| Shares, the nearest "served once earned" pattern | Contents only from `GET /container` after `resource_admits_player?`; an unadmitted share answers as an unknown id | `NA:1580-1625`; `GC:626-668` |
| Sessions | `start_login_session!(pc_id, npc, via, foothold:, credential:, relay:, from:)` writes `sessions[pcId] = { id, via }` plus those keys. `via` is free text; there is no parameter for further keys and no privilege field. It ends a guest session there, replaces the slot, prunes sessions that lost their route and returns their ids. Every session that is not a relay or a token is added to grow-only `signedInPcs` | `GM:4388-4417` |
| Who a session is | `session_identity` serves the desktop as the record's NPC id whatever `via` says; `reach_session_hosts` pivots through every session that is not a relay or an expired token | `GM:3243-3249`; `NA:1398-1413` |
| Lock, settle | Only `password` sessions and routed `credential` sessions can be locked. A desktop served at the keyboard drops `foothold` from the record unless `via` is `credential` | `GM:3824-3830`; `NA:1556-1565` |
| Keyring | Server-only `credentials` registry; an entry is served by `GET /keyring` once its one proof holds. `PROOF_KINDS = session, planted, dropped, held, foothold`; an unknown kind never holds. A `password` entry must set `foundIn`; a `token` must use a foothold proof | `CM:20-36`, `:62-67`; `CK:21-36`; `VS:7467-7535` |
| State defaults | `ACCESS_STATE_DEFAULTS`, filled per game with a shallow `dup` of each value | `GM:3021`, `GM:7576` |
| Routes | `GET /network`, `POST /network/plant|unplug|implant|join`; writers are in the `set_game` and `with_game_lock` lists | `config/routes.rb:51-55`; `GC:27`, `GC:103` |
| Scanning | None for hosts. `scanRows` in the rogue AP console is client-side Wi-Fi recon | `public/break_escape/js/minigames/rogue-ap/rogue-ap-model.js` |
| Schema | `networks.<id>` and `credentials.<id>.proof` are closed blocks. Server-only keys carry `x-serverOnly` and `x-servedBy`, which `test/support/payload_scan.rb` reads. Items already have `credential` and `storeIn` | `SC:281-369`, `SC:5158`, `SC:5679` |
| Validator | One function, `check_network_model`, in sections; no list of reserved fields | `VN:43-833` |
| Graph | A network node `exposes` each host's sign-in lock node `lock_<pcId>`; shares and pivots hang from that lock; a credential is a key node `cred_<id>` with an edge to each lock it opens | `DG:774-812`, `DG:1062-1075`, `DG:1624-1660` |

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

No field is reserved ahead of its stage, and none needs to be. A service entry, a `hosts` entry, a
network entry and the scenario's top level are all closed blocks in the schema, so a scenario that
writes `weaknesses` before S2 lands, or `techniques` before S3, fails the schema stage as an
unknown property. Each stage adds its own properties to those blocks.

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
  "<findingId>" }` (new proof kind). The validator requires the two to name each other. In S3 the
  entry's kind must be `saved_connection`: it needs no item text and opens its `connectsTo` PC
  through a foothold under that PC's own policy. A `password` entry must name a `foundIn` item
  whose text holds the password, and a `token` must be proved by a foothold, so neither fits a
  technique proof without a change to the keyring (question 9). The credential can connect to a
  different host from the one with the weakness: the printer's admin page gives up a saved
  connection to the file server.
- A grant of a session names an `account` (an NPC with `creds`) that the host's `access` list
  admits.
- A card may set the existing item field `storeIn` to file itself in a holder item, which keeps
  the tray clear with no engine work.

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
- A network block gains `ops: true` when some host on it declares `services`, and `swept` on a
  discovery network. The view offers Scan only inside a block marked `ops`. A block of a network
  with no services carries neither key, so its answer is the bytes it is today (section 10).
- **Enforced, not cosmetic.** `host_reachable_through?` (`NA:1477`) gains one condition: the
  host's network is open, or it is in `opsDiscovered.networks`. That one method is already the
  first check of remote sign-in (`GM:3465`), the remote account tiles (`NA:919`), the foothold
  desktop request (`NA:1510`), credential sign-in through a foothold (`credential_login.rb:201`,
  `:238`) and the routes the keyring offers (`CK:301`, `:400`, `:450`), so each of them refuses a
  host on an unswept discovery network with the answer it gives for a host out of reach.
  `from_route_refusal` (`NA:1349`) gains the same condition on the target's network, so a sign-in
  from a held desktop cannot skip the sweep either. The record is server-owned, so a client that
  knows a PC id from a room cannot skip it. Keyboard sign-in is untouched. A swept network stays
  swept, so no held session ever loses its route to this rule.
- A sweep needs the network in `player_reach(foothold)`. A host scan needs the host's network
  swept and in reach, and the host responding. `host_reachable_through?` only accepts a sign-in
  object, so the ops routes use a new `ops_host_in_reach?(foothold_id, host)` that asks the same
  two questions (foothold held, host's network in `player_reach` and listed) for either kind of
  host.

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

- **Session.** `start_login_session!` has no parameter for extra keys, so it gains two keyword
  arguments, `access: nil` and `technique: nil`, written to the record when present, as `foothold`
  and `credential` are. The call is `start_login_session!(pc_id, npc, 'technique', foothold:
  foothold_id, access: level, technique: finding_id)`. As for any sign-in, it ends a guest session
  at that PC, replaces a session the player already held there, and returns the ids of sessions
  that lost their route, which the answer carries as `endedPcIds`. The answer's `session` is what
  `login_session_answer` gives for a foothold session (`via: "technique"`, `remote`,
  `footholdId`, `host`) plus `access`. The client then calls `window.openRemoteDesktop(pcId,
  footholdId)` (`US:449`), the call the view's Open control makes today (`NV:880`).
- **Credential.** The finding id is added to `opsUsed`. `PROOF_KINDS` (`CM:36`) gains
  `technique`, and `credential_proof_holds?` (`CK:21`) gains `when 'technique'`: the proof holds
  when `opsUsed` includes the finding id it names. The answer carries `keyringChanged: true` and
  the client refetches `GET /keyring`. `credential_how` already answers `found` for a kind it
  does not name.

Both add the finding id to `opsUsed`. A repeat use answers `already: true` with the same fields;
if the session has since ended (an unplug, a newer sign-in at that PC), a repeat use grants it
again after the same checks.

`start_login_session!` adds the PC to `signedInPcs` for every session that is not a relay or a
token, so a technique session does too with no change. That list proves `session` credentials and
sign-in tasks for good (question 8).

**How a technique session differs from a password session.**

| Aspect | Password session through a foothold | Technique session |
|---|---|---|
| Record | `{ id, via: 'password', foothold }` | `{ id, via: 'technique', foothold, access, technique }` |
| Lockout on that account at that PC | refused | not consulted: no sign-in is attempted (question 5) |
| Policy `remote: "blocked"` | refused | not consulted: the way in is the service, not remote sign-in (question 5) |
| Policy `accepts`, MFA (S8) | apply | do not apply; S8 states this from its side |
| Lock the session | allowed | refused with no code change: `session_lockable?` (`GM:3824`) admits only `password` and routed `credential` sessions |
| Desktop at the PC's own keyboard | served, and the record drops `foothold` | served, as for a credential session, but the record keeps `foothold`: `settle_session_at_keyboard!` (`NA:1556`) returns early for `via: "technique"` as it does for `credential`, so an unplug still ends it |
| Pivots, maps shares, counts for `needsSession` | yes | yes |
| Unplug the foothold (N5) | ends | ends, by the same `end_sessions_through!` |
| Pivot lost | pruned | pruned, same loop |
| Outage or host off (N7) | kept, refused while down, works again after | the same |
| `fixedIf` becomes true afterwards | not applicable | kept: the player is already in. A new use is refused |
| Reload | kept | kept |

Everything else in the table is existing behaviour, because the record carries `foothold`.

**The one existing access check that changes.** Today the foothold branch of
`desktop_request_allowed?` (`NA:1509-1511`) is:

```ruby
host_reachable_through?(route[:foothold], pc) && !remote_blocked?(pc) && !host_service_off?(pc) &&
  !(session.is_a?(Hash) && session['via'] == 'claim') && !remote_route_session?(session)
```

Only the second term changes:

```ruby
(!remote_blocked?(pc) || technique_session_through?(session, route[:foothold]))
```

with a new predicate that reads the server's own record and nothing from the request:

```ruby
def technique_session_through?(session, foothold_id)
  session.is_a?(Hash) && session['via'] == 'technique' && foothold_id.present? &&
    session['foothold'].to_s == foothold_id.to_s
end
```

So the exception holds only when the session at that PC was granted by a technique and came
through the very foothold the request names. The other four terms still apply to it: the foothold
is held and reaches the host (and, on a discovery network, the network is swept), the host is on,
the session is not a claim, a relay or a `from` session. Three places repeat the term for display
and take the same predicate so that the view and the server agree: `desktop_refusal` (`NA:1036`,
so a technique session on a blocked host that is off answers `not_responding`), `host_row`
(`NA:1049`, so the row lists the session and sets `session.access`) and the client's `hostAction`
(`NV:215`, which answers `open` for a row whose `session.via` is `technique` before it reads
`remoteSignIn`). Folders under the PC are judged by the same method (`GC:3184-3196`) and follow.

What stays refused on a host whose policy blocks remote sign-in:

| Request | Answer, unchanged |
|---|---|
| Remote sign-in with a password, through any foothold (`POST /login`) | 422 `remoteBlocked` (`GM:3470`) |
| Remote account tiles (`GET /login_accounts` with `foothold`) | 422 `remoteBlocked` (`NA:923`) |
| Credential sign-in through a foothold or from a desktop | refused as today (`credential_login.rb:203`, `:219`, `:240`) |
| Desktop through a foothold with no session at the PC | 403 `no_session` (`GC:3146`) |
| Desktop through a foothold where the session is a password session made at the keyboard, a claim, or a credential session | 403 `unreachable` |
| Desktop for a technique session, naming a different held foothold that also reaches the host | 403 `unreachable` |
| Desktop for a technique session after its foothold is unplugged | the session is gone (`end_sessions_through!`); 403 `no_session` |
| Desktop for a technique session by a `from` or relay route | 403, by those branches, which this plan does not touch |
| A sync body that writes `sessions.<pcId>.via = "technique"` | ignored: `sessions` is server-written and no sync section carries it |

On a host that allows remote sign-in the term is true as before, so nothing changes there. The
hostile test for this is `network_technique_blocked_host_test.rb` (section 11.2): it sets up a
blocked host, proves each row of the table above with a session written through the real routes,
then gains the technique session and proves that only the request naming its own foothold opens
the desktop, and that an unplug closes it again.

### 5.5 Client

- `network-view-minigame.js`: a discovery block with no rows shows Sweep; a host row not scanned
  shows Scan; a scanned row expands to service tiles; a tile shows Check, then its findings; a
  finding shows Confirm, then its status and needs. A Techniques panel lists the held cards with
  name, summary and works-on line, read from the held items and the `techniques` the server sends
  for them. Select a finding, then a card, then Use. Pixel-art rules apply: 2px borders, pixel
  fonts, X closes. The view builds its rows as HTML strings through `escapeHtml` and `wordsHtml`
  (`NV:57`, `NV:71`); every new scenario or server string goes through the same two helpers or
  is set with `textContent`, and a hostile-string test covers each new field.
- `hostAction` (`NV:215`) answers `open` for a technique session before it reads `remoteSignIn`
  (section 5.4). `getTestState` (`NV:920`) gains, per host row, `scanned`, `services` and
  `findings` with a selector for each control, and top-level `techniques` and `selectedFinding`,
  so a scripted playtest can drive every step.
- A new pure module `network-view/ops-model.js` holds row merging, the works-on line, need labels
  and refusal texts, for node tests. The view imports it statically, so it joins the copy list of
  every node test that copies the view into a temp folder (section 11.3).
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
| `/network/scan` | `foothold`, and one of `network_id`, `host_id` | network in reach (403 `unreachable`); for a sweep: the network is a discovery network (422 `not_needed`); for a host: its network swept or open (404), the host declares `services` (422 `not_needed`), host responding (403 `not_responding`) | adds to `opsDiscovered`; answers `{ success, network: { id, hosts: [rows] } }` or `{ success, host: <row with services> }`; `already: true` on a repeat, same fields |
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
| That some host on a reached network declares services (`ops: true` on the block) | with the block | it says only that scanning is worth trying there; not which host, nor how many |
| A technique session's `via` and `access` | on the host row and in the session answer, once granted | |
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

Three keys in `ACCESS_STATE_DEFAULTS` (`GM:3021`), all written only by the routes in section 6,
never read from a sync body, never sent whole. The defaults are `{}`, `{}` and `[]`: each game
gets a shallow `dup` of the default (`GM:7576`), so a default must not hold a nested list that
games would share. `opsDiscovered` therefore starts empty and the writer creates its two lists;
readers treat a missing list as empty.

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

Reload: all three keys persist, so the view returns as it was. An unplug ends sessions but leaves
all three alone: what the player has learnt about a network stays learnt, and a network reached
again through a new foothold or a reopened pivot shows as it was left. A reset drops them with
the other access records. A game saved before this lands reads each as empty; with no `discovery` network
and no services in its scenario copy, nothing changes for it. Sessions with `via: "technique"`
persist like any foothold session.

## 9. Validator, schema and dungeon graph

### 9.1 Schema (`scripts/scenario-schema.json`)

Every block below is closed (`additionalProperties: false`) with the `"^_"` note pattern the
neighbouring blocks use, and every new open location carries the `x-id-map` mark that
`test/unit/scenario_schema_test.rb` demands. Each description names the code that reads the field.

| Stage | Where | Addition |
|---|---|---|
| S1 | `networks.<id>` (`SC:323`) | `discovery`: enum `open`, `scan` |
| S1 | top level, beside `resources` (`SC:347`) | `hosts`: id map (`propertyNames` with the id pattern, `x-id-map: true`), `x-serverOnly: true`, `x-servedBy: ["GET /network", "POST /network/scan"]`. Entry: `name` (required), `network` (required, `x-ref: network`), `sprite`, `offWhen` (the same `oneOf` as a network's), `services` |
| S1 | the object definition that holds `network` and `headless` (`SC:5525-5542`) | `services`, `x-serverOnly: true`, `$ref` to a new `definitions.service` |
| S1 | `definitions.service` | `name` (id pattern), `label` (max 40), `port` (integer 1 to 65535), `product` and `version` (1 to 40 characters); `name`, `port`, `product`, `version` required; array `maxItems: 8` |
| S2 | `definitions.service` | `weaknesses` (`maxItems: 4`) and `decoys` (`maxItems: 4`), as two new definitions with the fields and enums of section 0. `x-servedBy` gains `POST /network/check` and `/confirm` |
| S3 | top level | `techniques`: id map, `x-serverOnly: true`, `x-servedBy: ["GET /network"]`, `maxProperties: 32`. Entry: `name` (required, max 40), `summary` (max 200), `worksOn` (required; `class` required, `product`, `versions` as 1 to 8 strings) |
| S3 | the item definition, beside `credential` (`SC:5158`) | `technique`: a `techniques` key. It stays on the item the browser receives, as `credential` does; the registry entry it names does not |
| S3 | `credentials.<id>.proof` (`SC:293-306`) | `technique`: a finding id. The description's list of proof kinds gains it |

`test/js/validator-declared-top-level.test.mjs` gains `hosts` and `techniques`. The payload scan
(`test/support/payload_scan.rb`) reads the marks above, so `hosts`, `techniques` and `services`
fail it on any route their `x-servedBy` does not name; the four new routes join its scanned
routes.

### 9.2 Validator

The checks go in a new file `scripts/validate_network_ops.rb` with one function
`check_network_ops(json_data)`, required and run from `scripts/validate_scenario.rb` beside
`check_credentials` (`VS:8968`). `validate_network.rb` is one 800-line function that other ops
plans also extend, and a separate file keeps this plan's diff out of it. The function reads only
through the `NetworkModel` helpers of section 5.1, so the validator, the server and the graph
cannot disagree about what a host or a finding id is. The existing sections of
`check_network_model` that walk hosts (`VN:587` two hosts with one label, `VN:364` a network with
no host to pivot through) take `hosts` entries into account through `hosts_on`.

Errors:

| Stage | Error |
|---|---|
| S1 | A `hosts` key equal to a room object id or a `resources` key (one id space) |
| S1 | A `hosts` entry whose `network` is not a `networks` key; `services` on an object that is not a sign-in object |
| S1 | Two services with one `name` on a host; more than 8 services on a host; more than 64 hosts carrying services |
| S1 | `discovery: "scan"` on a network that has a `wifi` block or a jack but no host at all (a sweep would find nothing) |
| S1 | A `product`, `version`, `label` or host `name` that contains a password of the scenario (the rule `VN:519` applies to strings a foothold's view shows) |
| S2 | A weakness or decoy id used twice in one service; more than 128 weaknesses plus decoys in the scenario |
| S2 | `grants` with both kinds or neither; `grants.session` on a `hosts` entry; `grants.session.account` that is not an account holder, or that the host's access list does not admit |
| S2 | A `needs` entry that names nothing: an unknown credential id, an item type or id no item has, an undeclared global; `needs.session` on a weakness that does not grant a session on that host; `needs.session: "admin"` with `grants.session.access: "user"` |
| S2 | `fixedIf` naming a global that is not declared, or one whose starting value already holds with nothing in the scenario that can change it (the weakness can never be found) |
| S2 | A weakness on a network that no foothold's reach can include (the walk `VN:774` already computes) |
| S3 | `grants.credential` naming no `credentials` entry; the entry's `proof.technique` not naming this finding id, or a `proof.technique` naming no weakness; two weaknesses granting one credential; the entry's kind not `saved_connection` |
| S3 | A weakness no technique matches (`technique_matches?`), so it could never be used |
| S3 | A technique no item carries; an item whose `technique` is not a `techniques` key; more than 32 techniques |
| S3 | `worksOn.product` equal to no service's `product`; a `versions` entry equal to no version of that product |

Warnings:

| Stage | Warning |
|---|---|
| S1 | A host with `services` on an open network where nothing has a weakness (services that are only scenery are allowed, but it is usually a slip) |
| S2 | A weakness or decoy id containing a telltale word: `decoy`, `fake`, `false`, `real`, `true`, `bait` (the id reaches the browser inside the finding id) |
| S2 | `fixedIf` as the only thing between the player and a grant: it is a soft gate, because globals are client-synced, like an outage |
| S2 | A `summary` or `falseBecause` that reads as a procedure: it contains a command-like token (a path, a flag beginning with `-`, a pipe) or is longer than 200 characters |
| S2 | A decoy and a weakness in one service with the same class and severity and no `summary` on either (the player has nothing to tell them apart by after confirming) |
| S3 | A technique that matches only decoys' classes and no weakness (a card with no use) |
| S3 | A weakness that grants a session on a host whose only other way in is also that weakness's own need (a loop) |
| S1 to S3 | A `product` string found in `scripts/real_product_names.txt`, a short list kept beside the validator so that examples stay invented |

The schema stage catches the enums, the caps on a single list and unknown properties. The
validator's known-failures list (`scripts/validator_known_failures.json`) must not grow: no
existing scenario uses these fields.

### 9.3 Dungeon graph (`scripts/generate_dungeon_graph.rb`)

A chain through hosts must read as a chain, and a scenario with none of the new fields must
produce the graph it does today. The new drawing is one block after the credential block
(`DG:1624`), run only when `NetworkModel.weaknesses(scenario)` or `hosts(scenario)` is not empty.

| Thing | Node | Edges |
|---|---|---|
| Discovery network | the network node already drawn (`DG:773`), its label gaining a second line "(sweep to list)" | unchanged |
| Host with no sign-in | `host_<id>`, class `container`, label: name and "device" | from its network node, labelled `exposes`, as a sign-in host's lock is (`DG:778`) |
| Weakness | `weak_<findingId>`, class `lock`, label: host name, service label and port, class and severity; a third line "fixed if <global>" when `fixedIf` is set, written as outage conditions are (`DG:653`) | on a sign-in host, from the network node, labelled with the service name (the host's own node `lock_<pcId>` means "signed in there", so it cannot be the source); on a device, from `host_<id>` |
| Technique card | `tech_<techniqueId>`, class `key`, label: the technique's name; one source node per carrying item at its home, drawn as held-credential sources are (`DG:1639-1644`) | to every weakness it matches |
| Need | no new node | an edge into the weakness from `cred_<id>` (a credential), from the item's existing node, or from `lock_<pcId>` of the same host (a session, for a step up) |
| Grant of a session | no new node | from the weakness to `lock_<pcId>`, labelled `grants session`. The lock node already stands for "a session held there" and already takes a second way in from a credential (`DG:1656-1660`), so shares and pivots that hang from it (`DG:797-803`, `DG:1062-1075`) are reached by either route |
| Grant of a credential | no new node | from the weakness to `cred_<id>`; the credential block's `case` gains `when 'technique'` and draws nothing itself |
| Decoy | not drawn | it gates nothing |

The legend gains one line for a weakness and one for a technique card, added only when the block
ran, as the network notes are (`DG:2030-2035`). `scripts/lock_key_diff.rb` treats `weak_*` as a
lock and `tech_*` as a key, so a card that becomes unreachable, or a weakness that loses its last
matching card, shows in the diff. `key_free?` and `scrub_label` (`DG:562-596`) are applied to
every new label, so no label can carry a password.

## 10. Effect on existing scenarios

None. A scenario without the new fields takes the old path at every point this plan touches:

| Change | Why an existing scenario does not see it |
|---|---|
| `network_rows` | `discovery` absent means open; `hosts` is empty, so no device row; a host row gains `scanned` and `services` only after a host scan, which needs `services` to exist |
| `host_reachable_through?`, `from_route_refusal` | the added condition is true for every open network |
| `desktop_request_allowed?`, `desktop_refusal`, `host_row`, `hostAction`, `settle_session_at_keyboard!` | each new term asks for `via: "technique"`, which only `POST /network/technique` writes |
| `start_login_session!` | two keyword arguments that default to nil and write nothing |
| `PROOF_KINDS`, `credential_proof_holds?` | a new kind no existing credential uses |
| The four routes | with nothing declared: a sweep answers 422 `not_needed`, as does a host scan of a host with no `services`, and neither records anything; check, confirm and technique answer 404 |
| State | three keys that default empty and are never sent |
| Bootstrap and room data | two more names in the withheld lists, for keys no existing scenario has |
| Schema, validator, graph | new optional properties; `check_network_ops` returns at once when there are no `hosts`, `services` or `techniques`; the graph block does not run |

One point needs a decision made visible: a host scan on an existing open network would add
`scanned: true` to a row once a player pressed Scan. The view therefore offers Scan only on a row
whose network block the server marks `ops: true`, which it does only when some host on that
network carries `services`. In an existing scenario no block is marked, no control appears, and
the answer to `GET /network` is the same bytes as today.

**The check that proves it** has four parts, all committed in build step 1, before any engine
change, so that the "before" side is main's own output:

1. **Golden answers.** `test/controllers/break_escape/network_ops_unchanged_test.rb` plays a fixed
   script through the real routes for each scenario that declares `networks` (today
   `test_access_networks`, `test_access_devices`, `test_access_keyring`, `test_author_notes`,
   `demo_access_tour`, `lab_physical_pentest`, `ca20_remote_and_mobile_working`,
   `ca20_remote_and_mobile_working_defend`; the test finds them by the key, so a new one joins
   without an edit): gain each foothold, sign in remotely where the scenario allows, then record
   the bootstrap, each room answer, `GET /network` per foothold, `GET /keyring` and the desktop
   answer. The recordings are JSON fixtures under `test/fixtures/files/ops_unchanged/`, written
   once from main by a rake task and compared for equality on every run after.
2. **Validator and graph output.** A node test, `test/js/ops-unchanged-validator.test.mjs`, runs
   the validator and the graph generator over every scenario folder and compares the validator's
   lines and the graph JSON with a snapshot taken on main. The `dungeon_graph.*` files checked in
   beside scenarios must show no diff after regeneration.
3. **The existing suites, unmodified.** The Rails suite and `bin/test-js` pass with no edit to an
   existing test, apart from the copy lists in section 11.3. The network tests most at risk are
   `network_remote_signin_test.rb`, `network_remote_tiles_test.rb`, `network_pivot_test.rb`,
   `network_outages_test.rb`, `network_host_service_off_test.rb`, `network_no_exposure_test.rb`,
   `keyring_route_test.rb` and `lab_physical_pentest_network_test.rb`.
4. **Scripted reruns.** After S3 lands, the existing `PLAYTEST.md` scripts of
   `test_access_networks`, `test_access_keyring` and `test_access_devices`, and the network beats
   of `lab_physical_pentest`, are rerun on Haiku and must pass with their leak scans clean. The
   campaign missions m01 to m10 declare no `networks` and are covered by parts 2 and 3.

Hacktivity's tests load `test_objectives` and `test_simple_success` from this repo; neither
declares networks and neither is touched.

## 11. Tests

Each stage lands with all of its rows below. A stage is not done on helper tests alone: the
scripted playtest and the live proof run on the real routes in a real browser.

### 11.1 Unit (`test/unit/`)

| File | Stage | Covers |
|---|---|---|
| `network_model_test.rb` (extended) | S1 | `hosts`, `discovery?`, `hosts_on` (both kinds, sorted by id, a `hosts` entry with an unknown network left out), `services_of` reading at most 8 |
| same | S2 | finding ids; `weaknesses` and `decoys` reading at most 4 each; a malformed entry skipped, never raised on |
| same | S3 | `technique_matches?` for class only, class and product, class, product and version, and each near miss; `technique_items` finding a card in a room, a container, an NPC's items, a share and the start inventory |
| `credential_model_test.rb` (extended) | S3 | `proof_kind` answers `technique`; a proof with `technique` and a second key is malformed |
| `scenario_schema_test.rb` (runs as is) | S1 to S3 | every new open location carries its mark |

### 11.2 Controller (`test/controllers/break_escape/`)

Every test drives the real routes on a game built from a fixture scenario and reads
`player_state` back from the database.

| File | Stage | Covers |
|---|---|---|
| `network_scan_test.rb` | S1 | each check of `/network/scan` in order, with its status and reason; a sweep through a foothold that does not reach the network; `already` carrying the same fields; `GET /network` before and after; a second network swept only after a pivot session; discovery kept across an unplug and a new foothold |
| `network_discovery_enforced_test.rb` | S1 | on an unswept discovery network, with a PC id the client was never sent: remote sign-in, account tiles, desktop, credential sign-in through a foothold, sign-in from a held desktop, and the keyring's offered routes, each refused as out of reach; each allowed after the sweep; keyboard sign-in at that PC allowed throughout; the same requests on an open network unchanged |
| `network_findings_test.rb` | S2 | check before scan (404); a check's answer with a decoy and a weakness built from the same keys in id order; confirm for each; an invented finding id (404); a weakness whose `fixedIf` holds left out of a check; one already found shown `fixed`; `met` recomputed on each read as an item is picked up and a credential earned |
| `network_technique_test.rb` | S3 | every refusal of section 5.4 in its fixed order, one test per reason, each asserting nothing was written; both grants; `already`; a grant again after the session ended; `endedPcIds` when the grant replaces a pivot session; the step up replacing the record in place and keeping `foothold`; `signedInPcs` gaining the PC |
| `network_technique_blocked_host_test.rb` | S3 | the hostile test for the changed access check. On a host with `remote: "blocked"`: every row of the "stays refused" table in section 5.4, each with a session made through the real routes; then the technique session opens the desktop and its folders through its own foothold and through no other; the row lists the session; host off answers `not_responding`; an unplug ends it and the next request is `no_session`. On a host that allows remote sign-in: a password session's desktop behaves as before |
| `network_technique_hostile_test.rb` | S3 | a card item id the player does not hold; an item the client forged into its inventory; an item with a `technique` field the client added; a finding id of another host; a foothold id not held; a sync body that writes `opsDiscovered`, `opsFindings`, `opsUsed` or a session with `via: "technique"`; non-string and over-long parameters. Each is refused or ignored and leaves the state untouched |
| `network_technique_session_test.rb` | S3 | the table in section 5.4 row by row: lock refused, keyboard desktop served and `foothold` kept, pivot, share mapping, `needsSession` for an implant, outage and host off kept then refused then working again, `fixedIf` turning true afterwards, reload |
| `network_ops_no_exposure_test.rb` | S1 to S3 | the no-exposure list of section 7 at each step of a full run, over the bootstrap, every room, `GET /network`, `GET /keyring`, `GET /container` and all four ops answers; the payload scan over the same answers |
| `network_ops_state_delta_test.rb` | S1 to S3 | no ops key appears in any sync answer; each route's answer holds only what it changed; the size of `GET /network` at full discovery of `test_ops_access` is under 16 KB |
| `network_ops_unchanged_test.rb` | step 1 | section 10, part 1 |
| `keyring_route_test.rb` (extended) | S3 | a `technique` proof holds only after the use; the entry is absent from `GET /keyring` before |

### 11.3 Node (`test/js/`)

| File | Stage | Covers |
|---|---|---|
| `ops-model.test.mjs` | S1 to S3 | row merging, the works-on line, need labels, every refusal reason mapped to a text, unknown reasons mapped to a neutral text |
| `network-view-ops.test.mjs` | S1 to S3 | the controls each row state offers; `hostAction` for a technique session on a blocked host, and unchanged for every existing row shape; `getTestState` fields; hostile strings in host names, products, summaries, reasons and technique names rendered as text |
| `api-client-network-ops.test.mjs` | S1 to S3 | the four calls: path, body, `delta: true`, error mapping |
| `validator-network-ops.test.mjs` | S1 to S3 | one fixture per error and warning of section 9.2, and a clean fixture per stage |
| `dungeon-graph-ops.test.mjs` | S2, S3 | the nodes and edges of section 9.3 for `test_ops_access`; no password in any label |
| `lock-key-diff.test.mjs` (extended) | S3 | a removed card and a removed weakness show in the diff |
| `ops-unchanged-validator.test.mjs` | step 1 | section 10, part 2 |

**Harness copy lists.** There is no central list: each node test that copies part of
`public/break_escape/js` into a temp folder names its own files. `ops-model.js` is a static import
of the view, so it is added to the copy list of every test that copies
`network-view-minigame.js`: today `network-view.test.mjs`, `minigame-consoles-fit.test.mjs`,
`pc-monitor-frame.test.mjs` and `escaping-shared-helpers.test.mjs`. The build step greps
`test/js` for `network-view` again before it finishes, since other branches add tests.
`ops-model.js` imports nothing, so it adds no second-level entries. `bin/test-js` retries a file
only for a module missing from the temp folder under load; a file that is really absent from a
copy list fails every attempt.

### 11.4 Feature scenarios and scripted playtests

Three small scenarios under `scenarios/`, each with `mission.json`, a generated dungeon graph and
a `PLAYTEST.md` in the layout of `scenarios/test_access_networks/PLAYTEST.md` (setup, harness
notes, then one subsection per beat). A beat is driven through `window.__test`, reads the view
through the minigame's `getTestState`, captures every response for the leak scanner, and reads
the server's record with the playtest's state reader. Scripted runs go to Haiku; a "stuck" claim
is checked on Sonnet. Headless runs use `window.__test.throttleFps(20)`.

All names are invented. Each scenario has two jacks, so that a second foothold exists for the
hostile beats, and a wall switch that sets a global, for `offWhen` and `fixedIf`.

**`test_ops_scan` (S1).** A lobby with two jacks and a note holding one password. `guest_lan` is
open: one PC with a service. `office_lan` is `discovery: "scan"`: a printer and a camera recorder
(devices), `files01` (headless sign-in) and `desk01` (a sign-in PC in a locked room).
`plant_lan`, also discovery, links to `office_lan` and holds a door controller.

| Beat | The player does | The browser receives | The server records |
|---|---|---|---|
| 1 | Plants the device in jack B, opens the view | one `office_lan` block: `swept: false`, no rows, a Sweep control; no host name, count or product anywhere | the foothold; ops keys empty |
| 2 | (hostile, by direct request) remote sign-in, tiles and desktop for `desk01` | 403 unreachable for each | nothing |
| 3 | Sweep | four rows: two devices, two PCs; no services | `opsDiscovered.networks` has `office_lan`; log row `network_swept` |
| 4 | Scan on the printer, then again | two service tiles with name, port, product, version; the repeat has `already: true` and the same fields | the printer in `opsDiscovered.hosts`, once; one `host_scanned` row |
| 5 | Flips the switch, Scan on the camera recorder | 403 `not_responding`; the row shows powered down | nothing |
| 6 | Signs in to `files01` from the view with the note's password | the desktop; back in the view a `plant_lan` block, unswept | the session with its foothold |
| 7 | Sweeps `plant_lan`, scans the door controller | its row, then its services | both recorded |
| 8 | Reloads the page, opens the view | the same blocks, rows and tiles as before the reload | unchanged |
| 9 | Unplugs, plants in jack B again | sessions ended; `office_lan` still swept, tiles still shown; `plant_lan` gone until the pivot is opened again, then shown swept | sessions gone; `opsDiscovered` unchanged |
| 10 | Plants in jack A (`guest_lan`) | the PC listed at once with a Scan control; no Sweep control | nothing new until Scan |
| 11 | End of run | leak scan: no host, product or version string before the beat that earned it | |

**`test_ops_findings` (S2).** One discovery network. The printer's admin page has a weakness that
needs a manual (an item in a cupboard) and a decoy. The file server's service has a weakness with
`fixedIf` on the switch's global. The camera recorder has only a decoy. A second service on the
file server has a weakness that needs a credential the scenario never gives.

| Beat | The player does | The browser receives | The server records |
|---|---|---|---|
| 1 | Plants, sweeps; (hostile) checks the admin page before any host scan | 404 | nothing |
| 2 | Scans the printer, presses Check on the admin page | two findings, both `unconfirmed`, the same keys on each, in id order; no needs, no reason, nothing naming a decoy | two entries `u`; one `service_checked` row |
| 3 | Confirms the decoy | status `false` and the authored reason | entry `f`; `finding_confirmed` |
| 4 | Confirms the other | status `confirmed`; needs: the manual, not met | entry `c` |
| 5 | Takes the manual from the cupboard, waits for the refetch | the same finding, the need now met | nothing: `met` is computed on read |
| 6 | Scans the file server, checks its first service, confirms | a confirmed finding | recorded |
| 7 | Flips the switch (the fix), waits for the refetch | that finding shows Fixed | status still `c`; `fixed` is computed on read |
| 8 | Checks the camera recorder, confirms | one finding, then `false` | recorded |
| 9 | (hostile) confirms an invented id and the id of a weakness never checked | 404 for both | nothing |
| 10 | Reloads | every finding as it was | unchanged |
| 11 | Run B, fresh game: flips the switch first, then checks the file server's first service | no finding for the fixed weakness | no entry for it |
| 12 | End of each run | leak scan: no class or summary before a check; no reason or need before a confirm; no `grants`, `fixedIf` or global name ever | |

**`test_ops_access` (S3).** `office_lan` (discovery) holds the printer, `files01` (headless,
remote sign-in allowed) and `vault01` (headless, policy `remote: "blocked"`). `plant_lan` links
to it and holds one PC. Cards: one for factory accounts (in a folder in the lobby), one for the
file service's product and versions (on an NPC, handed over in dialogue), one for another class
and one for the right product at the wrong version (both in a drawer). The printer's weakness
needs the manual and grants a saved connection to `files01`. `vault01` has two weaknesses: one
grants a session with `access: "user"`, the other needs that session and grants `admin`.
`files01`'s file service has a weakness with `fixedIf` on the switch's global.

| Beat | The player does | The browser receives | The server records |
|---|---|---|---|
| 1 | Plants in jack A, sweeps, scans and checks everything | findings, all unconfirmed; the Techniques panel lists only the card held so far, with its works-on line | as in the first two scenarios |
| 2 | Uses the held card on an unconfirmed finding | 422 `not_confirmed` | `technique_refused` row; nothing else |
| 3 | Confirms all; uses the card on the printer's decoy | 422 `false_positive` | row only |
| 4 | Collects the drawer's cards; uses each on `vault01`'s first weakness | 422 `wrong_class`, then `wrong_version` | rows only |
| 5 | Uses the factory accounts card on the printer's weakness without the manual | 422 `need_unmet`, naming the manual | row only |
| 6 | Takes the manual, uses the card again | success, `keyringChanged`; the keyring now lists the saved connection, which the answer to `GET /keyring` did not hold before | the finding in `opsUsed`; `technique_used` |
| 7 | Opens the saved connection | the `files01` desktop | a `credential` session with the foothold |
| 8 | Tries remote sign-in to `vault01` from the view | "Remote sign-in off" | nothing |
| 9 | Talks to the NPC, receives the product card, uses it on `vault01`'s first weakness | success; the `vault01` desktop opens; the row shows the session | `sessions.vault01`: `via: technique`, the foothold, `access: user`, the finding id; `signedInPcs` has `vault01` |
| 10 | (hostile) plants a second device in jack B, requests the `vault01` desktop naming that foothold; requests a use with a card id not held; posts a sync body with the ops keys set | 403 unreachable; 404; the body ignored | nothing changed |
| 11 | Uses the first card that fits on the step-up weakness | success | the record replaced: `access: admin`, same foothold |
| 12 | Opens the view | a `plant_lan` block reached through `vault01`; sweeps it | recorded |
| 13 | Tries to lock the `vault01` session | refused | unchanged |
| 14 | Reloads | sessions, findings, cards and keyring as before | unchanged |
| 15 | Flips the switch that fixes `files01`'s file service, tries the product card on its confirmed finding | 422 `fixed`; the `vault01` session still opens | row only |
| 16 | Unplugs the jack A device | `vault01` and `files01` sessions ended, `plant_lan` gone; a desktop request answers `no_session` | sessions gone; `opsUsed` and the keyring entry kept |
| 17 | Plants again, uses the card on `vault01`'s first weakness | the session again | a new record |
| 18 | End of run | leak scan clean; `GET /network` at full discovery measured and under 16 KB | |

The scenario also carries one NPC line on `network_technique_used` and one objective per event of
section 5.5, so the events are proved to drive a task. The line is in the NPC's file.

**Leak scanner.** `tools/playtest/lib/access_leak_scanner.rb` gains `collect_ops_secrets`, beside
`collect_network_secrets` (`:494`). It collects, with the same "not already in room text" rule:
host names of `hosts` entries and of sign-in hosts on discovery networks, products, versions,
service labels, summaries, `falseBecause` texts, technique names and summaries, and the global
names in `fixedIf`. Each string is tagged with the step that earns it (sweep, scan, check,
confirm, card held, never), and the scan takes the run's list of completed steps so that a string
is a leak only before its step.

### 11.5 Live proof

One per stage, in a headless browser against a keyless server, from a worktree server on `:3002`
where the main tree is in use (the worktrees share the development database, so no database task
is run). Each is a script under `tools/playtest/` that plays the stage's scenario by clicking
the real controls, saves a screenshot per beat, and asserts on the network log:

- S1: the view opens with no rows; the Sweep and Scan controls work; a direct request for the
  hidden PC is refused before the sweep.
- S2: Check and Confirm; the decoy's reason and the real finding's needs appear; the need's tick
  changes after the item is picked up, with no reload.
- S3: the refusal texts; the keyring gaining its entry; the desktop on the blocked host opening
  from the Use control, closing on unplug, and the same request then refused.

The S3 proof also runs the three existing network playtests' first beats in the same browser, as
a check that the unchanged view still loads and acts on an old scenario.

After S3, a screenshot review of the view at each state (empty, swept, scanned, findings, a card
selected, a refusal) goes to the user before the feature is called done.

## 12. Build steps and shared files

### 12.1 Steps

Each step is one commit on a feature branch cut from main, committed before its tests are run in
the shared tree. Steps 2 to 5 are S1, 6 to 8 are S2, 9 to 13 are S3. A stage is merged only at
the hash its full suites, scripted playtest and live proof ran on, and main is merged back into
the branch after each landing.

| Step | Stage | Work | Proof before moving on |
|---|---|---|---|
| 1 | before S1 | The unchanged-behaviour fixtures and tests of section 10, parts 1 and 2, recorded on main | they pass on main |
| 2 | S1 | Schema (9.1, S1 rows); `NetworkModel` helpers; `check_network_ops` S1 rules; the two withheld-list names | unit and validator node tests; step 1 tests |
| 3 | S1 | `network_ops.rb` with `scan_network!` and `scan_host!`; `opsDiscovered`; the route, both controller lists; `network_rows` and block changes; the condition in `host_reachable_through?` and `from_route_refusal` | `network_scan_test`, `network_discovery_enforced_test`, no-exposure and delta tests; step 1 tests |
| 4 | S1 | Client: `ops-model.js`, Sweep and Scan in the view, `api-client.js`, events, `getTestState`, copy lists | node tests; `bin/test-js` whole |
| 5 | S1 | `test_ops_scan` with its `PLAYTEST.md`, graph and leak collector; docs (N13 in `docs/ACCESS_AND_NETWORKS.md` and the `README_scenario_design.md` index) | scripted playtest, live proof, full suites; land S1 |
| 6 | S2 | Schema (S2 rows); model helpers; validator S2 rules; `check_service!`, `confirm_finding!`, `opsFindings`; the two routes; findings on rows | `network_findings_test` and the extended exposure tests |
| 7 | S2 | Client: Check, Confirm, the findings panel with needs and reasons; graph: weakness nodes (9.3, without cards) | node tests |
| 8 | S2 | `test_ops_findings`, playtest, leak collector steps, docs (N14) | scripted playtest, live proof, full suites; land S2 |
| 9 | S3 | Schema (S3 rows); `techniques` helpers; validator S3 rules; `PROOF_KINDS` and `credential_proof_holds?` | unit, validator and keyring tests |
| 10 | S3 | `start_login_session!` keywords; `use_technique!`; `opsUsed`; the route; the credential grant | `network_technique_test`, `network_technique_hostile_test` |
| 11 | S3 | The access check change alone: `technique_session_through?`, its use in `desktop_request_allowed?`, `desktop_refusal`, `host_row`, and the early return in `settle_session_at_keyboard!` | `network_technique_blocked_host_test`, `network_technique_session_test`, and every existing network and keyring controller test, unmodified |
| 12 | S3 | Client: the Techniques panel, Use, refusal texts, `hostAction`, the desktop handover and keyring refetch; graph: cards, needs, grants; `lock_key_diff.rb` | node tests |
| 13 | S3 | `test_ops_access`, playtest, live proof, the reruns of section 10 part 4, docs (N15), the screenshot review | all of it; land S3 |

Step 11 is its own commit so that the one change to an existing access check can be read,
reviewed and, if need be, reverted alone.

Models: implementation steps on Sonnet, the plan-versus-code review of each stage on Opus, step
11 and the hostile tests reviewed as a security review. Each implementing agent writes a handover
note and stops at about 150k tokens.

### 12.2 Shared files

Other ops plans touch these too. The order below is the order this plan needs; where two plans
are in flight at once, their sessions agree who goes first on each file.

| File | What this plan changes | Who else, and the risk |
|---|---|---|
| `app/controllers/break_escape/games_controller.rb` | four actions; their names in the `set_game` list (`:27`) and the `with_game_lock` list (`:103`) | every ops plan adds actions to the same two long lines: a certain merge conflict, resolved by keeping both sets |
| `config/routes.rb` | four lines after `network/join` (`:55`) | S5, S7, S8 add lines nearby |
| `app/models/break_escape/game.rb` | `ACCESS_STATE_DEFAULTS` (three keys); `start_login_session!` (two keywords); the include of `NetworkOps` | S5a reads `access` on the record and may add its own keys to the same constant; S8 and S5c change the sign-in order just above |
| `app/models/break_escape/network_access.rb` | the withheld lists (`:18-21`), `network_rows`, blocks, `host_row`, `host_reachable_through?`, `from_route_refusal`, `desktop_request_allowed?`, `desktop_refusal`, `settle_session_at_keyboard!` | S5a (what a session may do), S9 (log rows on existing actions). This plan's new code lives in `network_ops.rb` to keep this file's diff small |
| `lib/break_escape/network_model.rb` | new helpers only, appended | S5c may add account kinds to host records |
| `lib/break_escape/credential_model.rb`, `app/models/break_escape/credential_keyring.rb` | `PROOF_KINDS`, one `when` | S7 builds the `hash` kind in the same catalogue; S5b adds a harvest proof |
| `public/break_escape/js/minigames/network-view/network-view-minigame.js` | rows, panels, `hostAction`, `getTestState` | S6 adds the second renderer and should read the view's data through `ops-model.js` instead of the DOM; S5a adds session badges |
| `public/break_escape/js/api-client.js` | four functions | every plan with a route |
| `scripts/scenario-schema.json` | section 9.1 | every plan; the file has very long lines, so two edits to one block conflict even when they do not overlap in meaning |
| `scripts/validate_scenario.rb` | one `require_relative` and one `run.call` (`:26`, `:8968`) | every plan adds a line in the same place |
| `scripts/generate_dungeon_graph.rb`, `scripts/lock_key_diff.rb` | one new block; one `when` in the credential block; legend lines | S5 and S7 add nodes after the same block |
| `tools/playtest/lib/access_leak_scanner.rb` | one collector | S5b, S7, S8 add collectors |
| `test/js/validator-declared-top-level.test.mjs`, the four copy lists of section 11.3 | new names | S6 adds a module to the same copy lists |
| `docs/ACCESS_AND_NETWORKS.md`, `README_scenario_design.md` | N13, N14, N15 in the feature index and a section each | every plan appends rows to the same index table |

New files, owned by this plan alone: `app/models/break_escape/network_ops.rb`,
`scripts/validate_network_ops.rb`, `scripts/real_product_names.txt`,
`public/break_escape/js/minigames/network-view/ops-model.js`, the test files of section 11, the
three scenario folders and the `ops_unchanged` fixtures.

This plan should land first among the six: S5a, S6, S7 and S9 all read shapes it creates.

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
8. **S5a.** A PC holds one session. A password sign-in at a PC where the player holds a technique
   session replaces the record, and `access` goes with it. S5a should say what level the new
   record has, and `needs.session: "user"` should be read through S5a's level helper once it
   exists, so that a password session can also feed a step up.
9. **S5b and S7.** Both produce credentials with no item behind them. A technique can grant only
   a `saved_connection` until one of them lets a `password` credential exist without `foundIn`
   (question 9); whichever plan does that should allow the `technique` proof on it too.
10. **S5c and S8.** `host_reachable_through?` and `from_route_refusal` gain the discovery
    condition, ahead of every sign-in check. Their new checks come after it in the order.
11. **S6.** `getTestState` of the view and `ops-model.js` are the data the second renderer
    should share. `ops: true` on a block is what tells either renderer that scanning applies.
12. **All.** `ACCESS_STATE_DEFAULTS` values are copied with a shallow `dup`, so a plan that adds
    a key gives it a flat, empty default.

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
   gets crowded, a card can already file itself in a holder item with the existing `storeIn`
   field.
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
8. **Does a technique session count as "signed in" for capture proofs and tasks.**
   `start_login_session!` adds every session that is not a relay or a token to `signedInPcs`, a
   grow-only list that proves `session` credentials and completes sign-in tasks for good. (a) Yes:
   no code change, and a chain built on "a session at this PC" works however the session was
   gained; an author who wants a password-only step gates it on the password, not on the session.
   (b) No: one more exception in that method, and a validator warning where a `session` proof
   names a host with a session-granting weakness. Recommend (a).
9. **Can a technique yield a password, or only a saved connection.** The keyring requires a
   `password` credential to name a `foundIn` item whose text holds the password, and a `token` to
   be proved by a foothold. (a) S3 allows only `saved_connection`, which needs no keyring change;
   (b) allow `password` with a technique proof, which needs the keyring to take its label from
   the credential itself and to serve the password without an item. Recommend (a) for S3, and
   (b) as part of S5b or S7, whichever first needs a credential with no item behind it.
10. **A sign-in replaces a technique session.** A PC holds one session, so signing in at
    `vault01`'s keyboard with a password replaces a technique session there (and the admin level
    with it), and a technique use replaces a password session. (a) Keep the one-slot rule as it
    is; (b) refuse a technique use that would replace a session of the same account. Recommend
    (a): it is the existing rule for every other sign-in, and S5a owns what the level means.
