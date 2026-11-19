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

These names are fixed for the other five ops plans. Authored ids match `^[a-z][a-z0-9_]{0,63}$`;
a `hosts` key, a service `name`, a weakness or decoy `id` and a technique id are shorter, at
most 40 characters, so each fits a log row (section 13). Ids that existed before this plan and
also appear in a row (a network id, a sign-in host's object id, a foothold's object id) keep
their pattern, and the validator refuses one longer than 40 characters in a scenario that
declares `logSources`. A finding id is built, not authored: three
authored ids joined by dots, so it has its own pattern and can be long. It is never typed and
never put in a log row; the alias stands in for it in both places.

| Thing | Where it is declared | Shape | Id other plans use |
|---|---|---|---|
| Host with a sign-in | a room object with `lockType: "login"` (as today), which may now carry `services[]` | unchanged, plus `services` | the object's `id` |
| Host with no sign-in | top-level `hosts.<hostId>` (new, server-only) | `{ name, network, sprite?, offWhen?, services[] }` | `<hostId>`, in one id space with objects and resources |
| Service | `services[]` on either kind of host | `{ name, label?, port, product, version, weaknesses[]?, decoys[]? }`; `name` is unique on its host and is the service's id | `<hostId>.<serviceName>` |
| Weakness | `services[].weaknesses[]` | `{ id, class, severity, summary?, evidence?, needs?, grants?, fixedIf? }` | finding id `<hostId>.<serviceName>.<weaknessId>` |
| Decoy | `services[].decoys[]` | `{ id, class, severity, summary?, evidence?, falseBecause }` | finding id, same form |
| Finding | not authored; a server record made by a check | `{ id, alias, hostId, service, class, severity, summary, status, evidence? }`, `status` is `unconfirmed`, `confirmed` or `false`; a confirmed finding also carries `needs[]`, and `fixed: true` while its weakness's `fixedIf` holds (never on an unconfirmed or false one). `alias` is a short name (`f1`, `f2`, ...) given in the order the player found them, unique in the game | finding id; the alias is for display and for typing |
| Technique | top-level `techniques.<techniqueId>` (new, server-only): the technique card registry | `{ name, summary?, worksOn: { class, product?, versions? } }` | `<techniqueId>` |
| Technique card | an inventory item with `technique: "<techniqueId>"` | an item of type `technique_card`, a new plain tray type with no engine behaviour of its own (section 4.3); holding it is having the card | the item's `id` |
| Noise | `networks.<id>.alert` (optional) | `{ after, sets }`: when the network's noise count reaches `after`, the server sets the global `sets` | the global's name |

Enumerations:

- `class`: `default_creds`, `unpatched`, `misconfig`, `weak_auth`, `cleartext`.
- `severity`: `low`, `medium`, `high`.
- `needs` (all must hold; reach to the host is always needed and is not written): `credential:
  "<credentialId>"` (in the keyring), `item: "<itemId>"` or `itemType: "<type>"` (held, not
  forged; never an item's display name), `session: "user" | "admin"` (a session already held on
  this host, for a step up), `global: <requireGlobal form>`. An `itemType` or `global` entry
  also carries an authored `label`, the words the player is shown for it (section 4.2).
- `evidence` (one of): `item`, `itemType`, `credential` or `global`, in the same forms, with
  `label` under the same rule. Holding it lets the player confirm the finding without noise
  (section 1).
- `grants` (optional; one kind when present): `{ "session": { "account": "<npcId>", "access":
  "user" | "admin" } }`, only on a host with a sign-in; or `{ "credential": "<credentialId>" }`,
  on any host. There is no third kind. The credential must be of kind `saved_connection`; the
  offline cracking feature (A21) widens that rule to `hash` when it is built, and a weakness that
  yields a hash is then written the same way, with the hash entry carrying the technique proof
  (section 4.3). A weakness with no `grants` is a finding to read, report or hang an objective
  on; no card does anything with it (sections 3 and 5.4).

A session granted by a technique is an ordinary entry in `player_state.sessions[<pcId>]` with `via:
"technique"`, the `foothold` it came through, `access` (`user` or `admin`) and `technique` (which
holds the finding id that granted it, not a registry key). This plan makes the one edit to
`start_login_session!` that writes those keys. The stored `access` key is written only on a
technique session's record; a password, claim or credential session's record has none, exactly
as today. This plan only records the level. The privilege feature (S5a) owns what the level
means and computes it on each read with its own helper `session_access(pc_id)`: a technique
session has the level stored on its record, a typed or keyring sign-in as an account marked
`creds.admin` is admin, and everything else is user.

What the client is sent follows the computed level, for any kind of session: the session answer
(`login_session_answer`), the reloaded session mirror and the host row carry `access: "admin"`
when the level is admin and leave the key out otherwise. A missing key means user. Until
`session_access` exists, this plan's stage reads the stored key, so only a technique session
granted at admin carries it, which is the same rule over the sessions that can be admin at that
point. Nothing in an existing scenario can be admin, so its answers do not change (section 10).
This plan's panels draw the level wherever a session is shown (section 5.5); the privilege
feature supplies only the value.

A technique session's record always keeps its `foothold`: it is never settled at a keyboard
(section 5.4), a step up replaces the record in place with the same foothold, and a use through
another foothold writes a new record carrying that one.

The word `access` already names something else on a sign-in PC: the object's `access` list (who
may sign in). The two are unrelated, and validator messages say "access level" for this one.

A PC holds one session at a time (`GM:4388-4417`), so a technique session replaces whatever
session the player held there, as any new sign-in does, and a later sign-in replaces it.

Server state added (all server-owned, none a sync section): `opsDiscovered`, `opsFindings`,
`opsUsed`, `opsNoise` (section 8). Routes added: `POST /network/scan`, `/network/check`,
`/network/confirm`, `/network/technique` (section 6). `GET /network` gains fields on rows and
never a new route for reading.

A refusal's `reason` is a code, never display text. One client table, `REFUSAL_TEXT` in
`public/break_escape/js/minigames/network-view/ops-model.js`, turns a code into words. That
module is the one shared pure module for this screen: the abstract view and the command-line skin
(S6) both import it, and the skin plan builds on it instead of adding a second.

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
   marked unconfirmed. Some are real, and a scenario can add decoys. A finding may name a piece of
   evidence that would settle it ("Evidence: maintenance log, not held").
4. **Confirm a finding** (S2). Confirm settles it, in one of two ways. With the evidence in hand
   the control reads Confirm and is silent: the player went and found the maintenance log, the
   manual or the person who knows. Without it the control reads Probe: the player pokes the
   service to find out, which works but adds one to the network's noise. Either way a real
   finding becomes confirmed and now shows what it needs, as a short list with a tick or a cross
   against each line ("An account on this host: no"), and a decoy becomes false and shows the
   authored reason ("The banner is old; the service was patched"). This is where the player
   learns preconditions: the finding says what is missing before any card is tried.
5. **Use a technique card** (S3). Cards are things the player picks up in the world: a page in a
   contractor's folder, a file on a share, a gift from an NPC. A card's face says what it works
   on: a class, and sometimes a product and versions. The player selects a finding, then a card,
   then Use; that is the keyboard path and the one tests drive. Dragging a card onto a finding
   is a pointer shortcut that sends the same request. If the card fits and every need is
   met, the finding's grant happens: a remote desktop opens on that host as the named account, or
   a credential lands in the keyring.

**Why it is a puzzle and not trial and error.** Everything needed to choose is on screen before
the attempt: the tile gives product and version, the finding gives class and needs, the card gives
what it works on. Picking is reading and matching three facts. The work is in the needs: a missing
credential sends the player to a person, a missing item sends them to a room, a missing session
sends them to another host first.

**What guessing costs: noise.** Each network keeps a noise count, shown on its block ("Noise 2 of
5" where the scenario sets a limit). Two things raise it by one: a Probe (a confirm made without
the finding's evidence), and a card used where reading would have ruled it out (a card of the
wrong class, product or version, or any card on a finding already shown false). Nothing else
does: a sweep, a scan, a check, a confirm with evidence, and a use that is refused for an unmet
need, an unconfirmed finding, a finding that grants nothing or a fixed service are all quiet. When the count reaches the
network's limit the server sets a global the scenario named, once, and the block shows Alerted.
What follows is the scenario's to author with fields that already exist: a weakness with
`fixedIf` on that global is patched by the alarmed staff, a host with `offWhen` on it is taken
off the network, an NPC line or an objective hangs on it. So a decoy has a price (a Probe spent
on nothing), evidence has a value (it saves the Probe), and trying every card on every finding
runs out of room. A network with no `alert` still counts and shows its noise but nothing
follows, which suits a first tutorial. This is question 2, and the plan is written to its
recommendation.

**No cost in game time.** The server has no game clock, so a sweep, a scan, a check and a confirm
take no game minutes. Noise is the only cost.

**What failure tells the player.** One reason, the first that applies, in a fixed order: confirm
the finding first; this finding was a false positive; there is nothing to gain here (a real
finding that grants nothing); the service has been fixed; this card is for another class;
another product; another version; then the first unmet need by name. The answer also says
whether the attempt was noisy. A refusal changes nothing else.

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
| Session answers | `login_session_answer` builds the answer from named arguments; `session_for_client` (reload, `GET /scenario`) calls it with the record's `via`, `foothold`, `credential`, `from` and nothing else. The client's `pc-sessions.js` copies named fields in `load` and `publicSession` | `GM:4433`, `GM:3778-3791`; `pc-sessions.js:186-207`, `:352-387` |
| Server-written globals | A global the client cannot write (`server_owned_global_name?`); a server write is carried back in the same answer as `serverGlobals` | `GM:183-190`, `GM:193-243` |
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
| S2 (N14) | `weaknesses[]`, `decoys[]`, `evidence`, `fixedIf`, `networks.<id>.alert` and the noise count, `POST /network/check` and `/confirm`, the findings panel | `test_ops_findings`: findings appear only after a check; a decoy confirms false; a real one confirms and lists its needs; a fixed weakness yields no finding; probes raise the noise count to its limit and the alert global patches a weakness. No weakness in it has `grants`, so it passes the validator at S2 and unchanged after S3 | M |
| S3 (N15) | `techniques`, the item type `technique_card` and its field `technique`, `POST /network/technique`, `via: "technique"` sessions, the keyring proof kind `technique`, the techniques panel, the validator's grant checks (a granted credential's `connectsTo` PC must take it) | `test_ops_access`: a wrong card is refused with its reason; a card on a finding that grants nothing gets the quiet `no_grant`; the right card with needs met opens the desktop or adds the credential; unplugging ends the session | L |

No field is reserved ahead of its stage. What happens to a scenario that writes a field before
its stage is built depends on where the field sits, because the schema is closed in some places
and open in others:

| Field written early | Where it sits | What catches it |
|---|---|---|
| `weaknesses`, `decoys` on a service; `discovery`, `alert` on a network; `technique` in a credential's `proof` | blocks this plan declares closed (`definitions.service`, a `hosts` entry), or that are closed today (`networks.<id>`, `credentials.<id>.proof`) | a schema error: unknown property |
| `hosts`, `techniques` at the top level | the top level is open (no `additionalProperties`) | the corpus test `test/js/validator-declared-top-level.test.mjs`, which fails for a top-level key the schema does not declare. A single scenario run through the validator gets no error from the schema |
| `services` on a room object, `technique` on an item | `definitions.item` is open (177 properties, no `additionalProperties`) | only the unknown-key warning of `schema_unknown_key_warnings` (`VS:790-800`), and the engine ignores the field |

A warning is too quiet for a field that would silently do nothing, so the validator carries a
small table of this plan's fields against the stage that builds them, modelled on
`CredentialModel.kind_built?` (`CM:46`). While its stage is not built, each is a validator
error naming that stage's feature id: `hosts` and `services` on an object "not built yet: N13",
`techniques` and `technique` on an item "not built yet: N15".

The same table carries the two weakness fields that S2's schema declares and S3 builds: until
S3 lands, a weakness's `grants` (either kind) and `needs.session` are validator errors ("not
built yet: N15"). `grants` is optional at every stage, so an S2 scenario stays valid after S3.
An item of `type: "technique_card"` needs no entry: before S3 its PNG does not exist, so the
existing sprite check (`validate_scenario.rb:3273`) already refuses it. Each stage flips its
own entries when it lands, and the last stage removes the table.

## 4. Scenario fields

### 4.1 S1

```json
"networks": {
  "office_lan": { "name": "Office LAN", "discovery": "scan" }
},
"hosts": {
  "print01": {
    "name": "Second floor printer", "network": "office_lan", "sprite": "pnw_portable_printer1",
    "services": [
      { "name": "print", "port": 9100, "product": "Inkwell JetServe", "version": "1.4" },
      { "name": "admin_page", "label": "Admin page", "port": 80, "product": "Inkwell WebPanel", "version": "2.0" }
    ]
  }
}
```

and on a sign-in object in a room:

```json
{ "id": "files01", "type": "pc", "name": "File server", "lockType": "login", "headless": true,
  "host": "FILES01", "network": "office_lan",
  "access": { "people": ["npc_it_admin"] },
  "services": [ { "name": "files", "port": 445, "product": "Brackley ShareServe", "version": "3.1" } ] }
```

The object is a complete sign-in host as built today: `type` and `name` (both required of any
item), and an `access` list naming who may sign in, which a session grant in S3 is checked
against (section 4.3).

- `networks.<id>.discovery`: `"open"` (default, and the meaning of an absent key: every row is
  listed as today) or `"scan"` (rows are listed only once discovered). Per network, so one
  scenario can mix both.
- `hosts.<id>`: closed block, server-only. `name` and `network` required. `offWhen` as on an
  object. No `contents`, no lock, no room: a host here is never clicked in the world. If it should
  also be a prop in a room, the prop is an ordinary object and the two are not linked by the
  engine.
- `sprite` (optional) names a PNG in `public/break_escape/assets/objects/`, as an item's `type`
  does, and the validator checks the file exists. The view draws no sprite today; S1 adds a
  small icon at the left of a host row, the PC icon for a sign-in host and a plain device icon
  for a `hosts` entry with no `sprite`. Both default icons are existing object sprites.
- **A sweep needs no tool.** Any held foothold can sweep and scan. A field that makes a sweep
  need a held item (`scanNeeds`) is left for a mission that wants it and is not built here.
- `services[]`: at most 8 per host. `name` is an id of at most 40 characters, unique on the host. `port` is 1 to 65535,
  display only. `product` and `version` are plain text up to 40 characters. `services` on a room
  object is added to `WITHHELD_OBJECT_FIELDS` so it never rides on room data.
- A share (`resources` entry) on a discovery network is hidden with the hosts until the sweep,
  and is not served before it either (section 5.2).
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
      "evidence": { "item": "install_sheet" },
      "needs": { "item": "printer_manual" },
      "fixedIf": "printer_reset_done" }
  ],
  "decoys": [
    { "id": "old_banner", "class": "unpatched", "severity": "medium",
      "summary": "The page reports an old build number.",
      "evidence": { "item": "maintenance_log" },
      "falseBecause": "The build number is cosmetic. The panel was updated last month." }
  ] }
```

and on the network:

```json
"office_lan": { "name": "Office LAN", "discovery": "scan",
                "alert": { "after": 5, "sets": "office_lan_alerted" } }
```

- The example is a whole S2 weakness: it has no `grants`, because S2 builds none (section 3).
  The player can check it, confirm it and read what it needs. S3 adds the `grants` line
  (section 4.3) and the same weakness then takes a card.
- At most 4 weaknesses and 4 decoys per service. Ids are unique across both lists of a service.
- `summary` and `falseBecause` are plain text, up to 200 characters, written in game design terms:
  what is wrong, never how to exploit it. With no `summary` the view shows a line per class from
  an engine table.
- `fixedIf` takes a bare global name or the requireGlobal map, read by the same helper as
  `offWhen`. Section 5.3 says what a fixed weakness does to a check, a confirm and what is shown.
- `needs.session` is allowed only where `grants.session` is on the same host (a step up), so it
  arrives with S3.
- `needs.item` and `evidence.item` name an item by id, and `itemType` names a type; neither
  takes a display name. One entry uses one of the two. The server reads them with the
  identity-strict pattern of `credential_held_proof_holds?` (`CK:42-64`). For `item`: the
  inventory entry with that id is not forged and its id and type equal the authored
  definition. For `itemType` there is no one authored id, so the rule is: some held entry that
  is not forged, whose id is an authored item of that type and whose type equals that item's.
  `inventory_item_matching` (`NA:454-463`) is not used, because it also matches by name. The
  type `technique_card` is refused in `itemType`, so a card never doubles as evidence or a need.
- **Labels.** What the player is shown for a need or for evidence is, for `credential`, the
  credential's label, and for `item`, the item's name. A `global` names no object and an
  `itemType` names a type, so an `evidence` or `needs` map that holds one of those also holds
  a `label` for it (plain text, 1 to 40 characters; required then, refused otherwise): `{
  "itemType": "workstation_manual", "label": "Any workstation manual" }`. A `needs` map has
  one label, so it may not hold `itemType` and `global` together. The global's name is never
  shown.
- `needs.global` and `evidence.global` take any declared global. A global the client can write is
  a soft gate: the card, the finding and the reach are enforced by the server whatever a client
  sends, but that one condition could be met by a forged sync. That is the project's rule for a
  step gated by dialogue, and the validator says so with a warning (section 9.2). An author who
  wants a hard gate uses an item or a credential.
- `evidence` (optional, one thing) names what settles the finding quietly. Weaknesses and decoys
  both take it, and the unconfirmed finding shows its label and whether it is held. The evidence
  is an ordinary thing in the world whose own text tells the player what to expect: a
  maintenance log that says the panel was updated, an installer's sheet that says the factory
  account was left on. A finding with no `evidence` can only be probed.
- `networks.<id>.alert` (optional): `after` is 1 to 20; `sets` is a declared global, which the
  engine then treats as server-owned (the client cannot write it). With no `alert` the network
  still counts noise and nothing follows.

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

The printer's weakness of section 4.2 gains its grant, and the credential it grants is a keyring
entry that names the finding back:

```json
"grants": { "credential": "print_admin" }
```

```json
"credentials": {
  "print_admin": { "kind": "saved_connection", "account": "npc_it_admin",
    "connectsTo": "files01",
    "proof": { "technique": "print01.admin_page.factory_login" } }
}
```

and a session grant, on a weakness of a sign-in host's service:

```json
"grants": { "session": { "account": "npc_it_admin", "access": "user" } }
```

- **A card is a tray item tied to the registry.** It is not a server-computed collection like
  the keyring, and not a fixed list always on offer: cards arrive by every route items already
  use (rooms, containers, NPCs, shares), which is what ties them to social and physical play.
- **The card's type is `technique_card`, and only that.** An item's `type` is its sprite and
  also what the engine keys behaviour on, and the paper types are not plain (every `notes`
  type, `notes1` included, gets no tray slot and no pickup toast). A card must sit in the
  tray, so it gets a type no code reads: S3 adds
  `public/break_escape/assets/objects/technique_card.png` and its `load.image` line in
  `core/game.js`. The validator requires an item with `technique` to have this type and an item
  of this type to have `technique`. The build step greps `public/break_escape/js` and
  `scripts/` for the new name before the first card is placed, and
  `technique-card-item.test.mjs` pins the slot and the toast (section 11.3).
- **Placeholder art.** Until card art is made, `technique_card.png` is a byte copy of
  `qr_card.png`, an existing card-shaped object sprite that nothing in the engine or the
  scripts keys on (it appears only in its own `load.image` line). Section 12.1 lists the art
  task that replaces the file; no scenario changes when it does.
- `worksOn.class` required. `product` must equal a service's `product` exactly; `versions` is an
  explicit list of exact strings. There is no version comparison, so no ordering rules to explain
  or get wrong.
- `techniques` holds at most 32 entries, each id at most 40 characters. One technique may be
  carried by several items; a weakness may be matched by several techniques.
- **Two meanings of one word.** `technique` is already a field of a social engineering pretext
  line (`SC:3603`). No key collides; prose, descriptions and validator messages always say
  "technique card" and "technique card registry" (question 4).
- A grant of a credential names a `credentials.<id>` entry whose `proof` is `{ "technique":
  "<findingId>" }` (new proof kind). The validator requires the two to name each other. The
  entry's kind must be `saved_connection`: it needs no item text and opens its `connectsTo` PC
  through a foothold under that PC's own policy, so lockouts and `remote: "blocked"` on that PC
  apply to it as to any saved connection, and the example above works only where the file server
  allows remote sign-in and its policy accepts `saved_connection` (the default `accepts` list
  does, `CM:30`; a named policy may not). The validator checks both for the `connectsTo` PC of a
  granted credential and reports a grant that could never be used. The entry also carries the
  keyring's own required fields, `account` and `connectsTo`, as any saved connection does.
- **A technique yields a saved connection, never a password.** A `password` entry must name a
  `foundIn` item whose text holds the password, and a `token` must be proved by a foothold, so
  neither can carry a technique proof without a change to the keyring, and no plan makes that
  change. When the cracking feature (A21) is built it adds `hash` to the allowed kinds, a
  one-line change to this rule that belongs to that feature. The credential can connect to a
  different host from the one with the weakness: the printer's admin page gives up a saved
  connection to the file server.
- A grant of a session names an `account` (an NPC with `creds`) that the host's `access` list
  admits. That is checked by the validator with `pc_admits_account?`, not at run time: a
  technique session attempts no sign-in.
- A technique id reaches the browser on the card item, before the card is picked up wherever the
  item rides in room data. The id should say nothing the card's face does not; the validator
  warns when a technique id contains a word of a product name in the scenario.
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

- `network_rows` (`NA:873`) takes the view's foothold id as a second argument and passes it to
  `host_row` (section 5.4 says why). On an open network it answers as today plus `device` rows.
  On a discovery network it answers nothing until the network is in `opsDiscovered.networks`;
  then host rows and resource rows. A host row gains `scanned: true` and `services: [{ name,
  label, port, product, version }]` only when the host id is in `opsDiscovered.hosts`.
- A device row is `{ id, kind: 'device', name, sprite, responding? }`.
- A network block gains `swept` (true or false) on a discovery network, and `ops: true` when some
  host on it declares `services`. `ops` is sent only on an open network or a swept one: on an
  unswept discovery network it would say that the network holds at least one host, which is not
  told before a sweep, and the Sweep control there is offered on `swept: false` alone. The
  noise keys of section 5.3 are withheld from an unswept block for the same reason. The view
  offers Scan only inside a block marked `ops`. A block of a network with no discovery and no
  services carries neither key, so its answer is the bytes it is today (section 10).
- **Shares follow the sweep too.** `resource_admits_player?` (`NA:1580-1625`) admits an open
  share to any held foothold whose `player_reach` includes its network, and share ids can often
  be guessed from text in the world. Its foothold branch gains the same condition as hosts: the
  share's network is open, or swept. The session branch is left alone: a session on that network
  is a keyboard sign-in or a session the player earned after the sweep.
- **Enforced, not cosmetic (question 1).** `host_reachable_through?` (`NA:1477`) gains one condition: the
  host's network is open, or it is in `opsDiscovered.networks`. That one method is already the
  first check of remote sign-in (`GM:3465`), the remote account tiles (`NA:919`), the foothold
  desktop request (`NA:1510`), credential sign-in through a foothold (`credential_login.rb:201`,
  `:238`) and the routes the keyring offers (`CK:301`, `:400`, `:450`), so each of them refuses a
  host on an unswept discovery network with the answer it gives for a host out of reach.
  `from_route_refusal` (`NA:1349`) gains the same condition on the target's network, so a sign-in
  from a held desktop cannot skip the sweep either. The record is server-owned, so a client that
  knows a PC id from a room cannot skip it. Keyboard sign-in is untouched. A swept network stays
  swept, so no held session ever loses its route to this rule.
- **One question before any other: is the target listed for this player through this foothold?**
  `host_reachable_through?` only accepts a sign-in object, so the ops routes use a new
  `ops_listed?(foothold_id, target)`. For a network it holds when the foothold is held and the
  network is in `player_reach(foothold_id)`. For a host of either kind it holds when the host
  exists, its network is listed in that sense, and that network is open or swept. Every ops route
  asks it first and answers the one 404 of section 6 when it fails.

### 5.3 Server, S2

- A check needs the host listed, scanned and responding. For each weakness not fixed and each
  decoy of that service **that has no entry in `opsFindings` yet**, it adds an `unconfirmed`
  entry and gives it the next alias. An id already in the map is left exactly as it is, so a
  repeat check never turns a confirmed finding back to unconfirmed and never hands out a second
  alias. The answer lists every finding of that service the player now holds, each with its
  stored status and alias. Nothing tells a real one from a decoy until confirm: the answer
  builds both from the same fields in id order, and `evidence` rides on both alike as `{ kind,
  label, held }`.
- **A check is recorded whatever it finds.** The first check of a service adds
  `<hostId>.<serviceName>` to `opsDiscovered.services` and writes the `service_checked` row,
  even when it adds no finding (a service with no weaknesses or decoys, or whose only weakness
  is fixed). A check answers `already: true` only when the service is already in that list
  and the check adds no finding; a check that adds a finding never carries it.
  So a first check that finds nothing answers an empty `findings` list with no `already`, and
  an objective or NPC line on `service_checked` fires for every service the player checks. A
  repeat check still adds an entry and an alias for a weakness that has become unfixed since:
  it saves, answers with no `already`, and writes no second row.
- A confirm sets `confirmed` or `false`. If the finding has `evidence` and the player holds it,
  the confirm is quiet. Otherwise it is a probe and adds one to the noise of the host's network
  (below). The confirmed answer adds `needs`, each as `{ kind, label, met }`. `label` is the
  credential's label, the item's name, or the entry's own authored `label` for an `itemType`
  or a `global` (section 4.2); `met` and `held` are computed on each `GET /network`. A repeat confirm of a settled finding answers `already: true`, is
  quiet, and writes nothing.
- A first confirm of a weakness whose `fixedIf` has come true since the check still settles it
  as `confirmed`, so the player learns it was real, and the finding then carries `fixed: true`
  and shows Fixed. It is quiet with or without evidence: a fixed service gives a probe nothing
  to disturb, which matches the quiet `fixed` refusal of a card. `fixed` is computed on each
  read and sent only on a confirmed finding. Before the confirm, a finding whose weakness is
  fixed is sent with exactly the keys of any unconfirmed finding, and its control reads Confirm
  or Probe by `evidence.held` like any other, so nothing on screen says it is real.
- Findings ride on the host row: `findings: [...]` beside `services`, present only when the
  player holds at least one finding on that host. A host with services and no findings held
  carries no `findings` key, scanned or not, so an S1 scenario's rows are the same bytes before
  and after S2 lands.
- **No doubled noise from one click.** `api-client.js` has no retry for a failed or slow
  request. Every action of the network screen (sweep, scan, check, confirm, use and unplug)
  goes through one `perform` path in the scene, built by this plan and shared by both
  renderers, which holds one pending guard keyed by action and target: from the press until
  the answer arrives the control is disabled and a second press with the same key makes no
  call. Confirm and Probe are one action with one key, the finding; the key for `use` is the
  card and the finding together. So one press is one request. `perform` adds the key to the
  pending set and redraws the control as pending synchronously, before its first `await`; the
  request goes after. The existing test clicks the unplug button and checks it is disabled in
  the same tick (`test/js/network-view.test.mjs:1011-1013`), and a press that waited for a
  render or a load first would leave a window for a double press. The row drawing, including
  the redraw after the five-second refetch, reads the pending set, so a pending control is
  never redrawn enabled while its request is out. S1 builds the path with sweep and scan and
  folds the existing unplug guard into it (`_unplugging` in `unplugBox`,
  `network-view-minigame.js:829-860`), keeping the button's pending label, the notice's words
  and the markup of both; the renderer draws them from the pending set and the result
  (section 5.5), and `perform` writes no DOM. S2 adds check and confirm, S3 adds use. The
  server counts every noisy request it validates; a client that sends more only raises its own
  count.

  What the scene exposes to a renderer: `pending`, a `Set` of string keys that the scene owns
  and that a renderer only reads; one pure function, `pendingKey(action, target)`, that builds
  a key, so the guard and a renderer agree on it (`sweep` and `scan` by host, `check` and the
  shared Confirm and Probe key by finding, `use` by card and finding together, `unplug` by
  jack); and `perform(offer)`, where `offer` is the complete `{ action, target }` a control
  stands for, answering the server's reply or its refusal. The scene redraws the active
  renderer whenever the set changes, so a renderer needs no timer of its own.
- **Quiet or noisy is shown by the control and the count, nothing else.** The Confirm or Probe
  label says which a confirm will be, and the block's noise line shows the result. Panels has
  no separate quiet-or-noisy note on a finding or a card.
- **Noise.** `add_noise!(network_id)` adds one to `opsNoise[network_id]`. If the network declares
  `alert`, the count has just reached `after`, and the global is not already true, it sets the
  global through the server-write helper that carries a server-written global back in the same
  answer (`serverGlobals`, `GM:193-243`), so the client learns it without a reload. The `sets`
  name joins the names `server_owned_global_name?` (`GM:187`) answers true for, so a sync body
  cannot set or clear it. That needs a per-scenario source of names, built as the credit
  globals' is (`GM:187-190`); the name does not go in `SERVER_OWNED_GLOBAL_NAMES`, which would
  also hide the global from the client. The count stops rising at 99.
- **The noise keys on a block**, stated here once. A block of an unswept discovery network
  carries none of them. A block of an open or swept network carries `noiseLimit` whenever the
  network declares `alert`, so a block at zero noise carries `noiseLimit` alone and the view
  shows "Noise 0 of 5"; `noise` only when the count is above zero; and `alerted: true` only
  once the limit has been reached. With no `alert` and no noise the block carries none.

### 5.4 Server, S3

`use_technique!(foothold_id, finding_id, technique_item_id)`, checks in order:

1. The finding is in `opsFindings` and its host is listed through the foothold (`ops_listed?`);
   else 404, the answer an invented id gets.
2. The card: an inventory entry with that id that is not forged, whose id and type equal the
   authored item, and whose authored definition is of type `technique_card` and carries a
   `technique` that is a registry key.
   The technique is read from the scenario's definition of the item, never from the inventory
   copy, as `credential_held_proof_holds?` does (`CK:42-64`). Else 404.
3. The host is responding (403 `not_responding`).
4. **The repeat test.** For a weakness that grants a session: `sessions[<pcId>]` is a technique
   session whose `technique` is this finding id and whose `foothold` is the foothold named. For
   one that grants a credential: `opsUsed` holds the finding id. If so the request is a repeat
   (below) and the checks stop here.
5. Status is `confirmed` (422 `not_confirmed`, or `false_positive`).
6. The weakness has `grants` (422 `no_grant`). This comes before the match so that no card is
   ever weighed, or charged noise, against a finding that has nothing to give.
7. `fixedIf` does not hold (422 `fixed`).
8. The match (422 `wrong_class`, `wrong_product`, `wrong_version`).
9. Each need in the order credential, item, session, global (422 `need_unmet` with `need: {
   kind, label }`); `item` and `itemType` are read by the rules of section 4.2.
   `needs.session` asks for a session held at this PC, not locked, at the level
   named or above. The level is read through `session_access(pc_id)`, the privilege feature's
   helper, once that exists; until then this check reads the record's own `access` key and
   takes a record without one as `user`. So in S3 alone a password session can feed a step up
   that needs `user`, and only a technique session can feed one that needs `admin`.

Which refusals write. The first three checks and the repeat write nothing at all. Every 422
hands the log helper a `technique_refused` row (section 13). Four are noisy, adding one to the noise and
answering `noisy: true`: `false_positive`, `wrong_class`, `wrong_product` and `wrong_version`.
Four are quiet: `not_confirmed`, `no_grant`, `fixed` and `need_unmet`.

A noisy refusal's answer carries the block's new `noise`, and `alerted` and `serverGlobals` when
that request reached the limit (section 6). Nothing else in the state changes on a refusal. A
noisy refusal always saves, for the count. A quiet refusal is a branch that costs no save
today, so it follows the log plan's rule for such branches and passes the helper
`save_limit: true` (the limit, 10, is registered for `technique_refused` in the log plan's `EVENTS` list); a noisy refusal passes none. The helper keeps a stored count, per event, place and result,
inside a five-minute window of server time, of only the calls made with the limit that stored,
whatever the card or finding; a noisy refusal passes no limit, so it neither spends that count
nor is stopped by it. Once the count for `technique_refused` at a place has reached ten, a call
with the limit is dropped and answers nil until the window ends. The route saves only when the
helper's result is `stored?`. A quiet refusal sent over and over, or sent in a scenario with no
log source, therefore stops costing saves. Real time limits saves only; it decides nothing the
player gains.

**Which findings take a card.** The view and the command-line skin accept a card used against
any finding a row lists, whatever its status, by select-then-Use or by a drag in the view;
neither filters by status, the request is sent, and the server answers by the order above.

**A repeat.** A request is a repeat only when a technique session for this finding through this
foothold already exists (or, for a credential grant, the finding was already used), and it is
tested only after the finding, the reach and the card have passed. So a repeat never answers
more than a first use would: with the host unlisted, the card dropped or the host off, the
request has already been refused. A repeat answers `already: true` with the live session answer
(or `keyringChanged: false`), writes nothing, adds no noise and writes no log row. The session
it reports is one the desktop will serve through that same foothold, so the client's next
request cannot be refused. A repeat is answered even when `fixedIf` has since come true: the
player is already in, and the session is kept.

Anything else is a new use and runs every check. That covers a use of the same finding through
a different foothold that also reaches the host (a new session through that foothold replaces
the record, so the old foothold's view no longer lists it), and a use after the session ended
(an unplug, a newer sign-in at that PC, an NPC finishing a borrow). Then the grant:

- **Session.** `start_login_session!` has no parameter for extra keys, so it gains two keyword
  arguments, `access: nil` and `technique: nil`, written to the record when present, as `foothold`
  and `credential` are. The call is `start_login_session!(pc_id, npc, 'technique', foothold:
  foothold_id, access: level, technique: finding_id)`. As for any sign-in, it ends a guest session
  at that PC, replaces a session the player already held there, and returns the ids of sessions
  that lost their route, which the answer carries as `endedPcIds`. `login_session_answer`
  (`GM:4433`) and `session_for_client` (`GM:3778-3791`) add `access: "admin"` by the rule of
  section 0, both through one small reader, `client_access_level(pc_id)`, which in this stage
  returns the record's stored `access`; pointing it at `session_access(pc_id)` is the one line
  S5a changes here. The client's `pc-sessions.js` copies `access` in `load` and
  `publicSession`. The answer's `session` is what a foothold session gets (`via:
  "technique"`, `remote`, `footholdId`, `host`), plus `access` when the level is admin, so it
  survives a reload and rides in `GET /scenario`. The client then calls `window.openRemoteDesktop(pcId,
  footholdId)` (`US:449`), the call the view's Open control makes today (`NV:880`).
- **Credential.** The finding id is added to `opsUsed`. `PROOF_KINDS` (`CM:36`) gains
  `technique`, and `credential_proof_holds?` (`CK:21`) gains `when 'technique'`: the proof holds
  when `opsUsed` includes the finding id it names. The answer carries `keyringChanged: true` and
  the client refetches `GET /keyring`. `credential_how` already answers `found` for a kind it
  does not name.

Both add the finding id to `opsUsed`, once. For a session grant the list is a record that the
finding has been used (the log row's "first use" and the graph read nothing else from it); it
is not what makes a request a repeat.

**One slot per PC.** The existing rule stands with no exception for this feature: a password
sign-in at a PC's keyboard replaces a technique session there (and its level with it), a
technique use replaces a password session, and an NPC finishing a borrow of the PC ends either.
Refusing a use that would replace a session of the same account would be a new rule for one
session kind, and the card can always be used again.

**Who reads a session, and what a technique session does there.**

| Reader | Where | With a technique session |
|---|---|---|
| `signedInPcs`, written by `start_login_session!` for every session that is not a relay or a token | `GM:4388-4417` | the PC is added, with no code change, so everything that reads the list counts a technique session for good (question 5; warning in section 9.2) |
| `end_guest_session_at!`, run by every sign-in that is not a claim | `GM:4392` | a grant from across the network ends an NPC guest's session at that PC, as a remote password sign-in does. Stands: one screen holds one session |
| `record_borrow_done!`: an NPC who borrowed the PC finishes and the player's session there is deleted | `npc_frustration.rb:391-396` | the technique session ends, as a password session would. Stands. The finding stays confirmed and the card stays held, so the player can use it again: with no session there it is a new use and grants a new session |
| `session_identity`, `reach_session_hosts` | `GM:3243-3249`; `NA:1398-1413` | serves the desktop as the named account; pivots |
| `session_lockable?`, and the client's `sessionLockable` | `GM:3824`; `pc-sessions.js:176` | not lockable, on both sides, with no change |
| `session_for_client`, `pc-sessions.js` `load` and `publicSession` | `GM:3778-3791` | carry `access: "admin"` when the level is admin (above) |
| `screen-states.js` `signedInVia` | `:38` | the PC's screen in the world keeps its locked look, because `via` is neither `password` nor `credential`. That is right under this plan's keyboard rule (below): nobody is signed in at that screen. No change |
| `from_route_refusal`: a held desktop as the source of a sign-in to another PC | `NA:1347-1370` | a technique session's desktop is a valid source, like any held desktop; the source's own `remote: "blocked"` is not consulted, as today. Stands |
| `folder_route_allowed?`, `session_admits?` | `GC:3185-3197`; `GM:3260-3270` | one added line, below |
| The keyboard branch of `desktop_request_allowed?` | `NA:1512-1516` | one added term, below |

**At the PC's own keyboard.** Today a request with no route is served at any PC the player can
walk to that has a session, and a technique session would be served there too: the player would
sit down and be that account without its password. This plan refuses it, on every host (question
3, part (c)). The keyboard branch of `desktop_request_allowed?` gains "and the session is not a
technique session", and `desktop_refusal` answers a code of its own, 403 `network_only`, for
any request with no route at a PC whose session is a technique session. The code comes after
`expired` and ahead of `off` and `unreachable`, whether or not the player can reach the PC: the
session is the player's own, so it tells them nothing new. It cannot be `no_session`: to the
client that code means the server holds no session at the PC.

On the client, a keyboard fetch carries no route, so in `loadLoginDesktop`
(`container-minigame.js:980-1070`) it passes the foothold, `from` and relay handlers by and
can end a 403 in one of four places. The `expired` handler drops the copy but cannot meet a
technique session, which has no token; the powered-off handler (`off`) keeps it. The other two
drop it today: the
reopened-after-a-reader handler (`fromReturn`, `:1053-1063`) and the catch-all (`:1065-1070`)
both call `pcSessions.dropLocal`, which deletes the copy and emits `pc_signed_out` while the
server still holds the session. So one new handler goes after the powered-off one and before
those two: on a 403 whose reason is `network_only` it closes the screen and opens the plain
sign-in screen (`openLoginSignIn`), with no `dropLocal`, no sign-out event and no message.
Every path a keyboard fetch can take to that code therefore keeps the session. The foothold
and `from` handlers are not changed: a request that names a route is never answered
`network_only`. The handler shows no line, so `container-minigame.js` imports nothing from
`ops-model.js` and no test's copy list grows for it; `REFUSAL_TEXT` still holds a line for the
code, for a renderer that meets it.

In normal play the fetch is never sent. `heldAtKeyboard` (`pc-sessions.js:480`), false today
only for a relay session, becomes false for a copy whose `via` is `technique` as well. Its
fallback for a mirror without that method (`unlock-system.js:266-275`) is `has()` today, which
is true for a relay copy; the fallback gains the same full test, relay included, by reading
`sessions.get(pcId)` (`publicSession` carries both `via` and `relay`).
Every keyboard decision reads it (`keyboardSession`, `openLoginPc`, `interactLoginPc`, the
sign-in screen's `onComplete`), so the PC shows the sign-in screen without asking.
The handler is for a client whose copy is stale. If the player then signs in at the keyboard
with a password, the one-slot rule replaces the technique session.

**How a technique session differs from a password session.**

| Aspect | Password session through a foothold | Technique session |
|---|---|---|
| Record | `{ id, via: 'password', foothold }` | `{ id, via: 'technique', foothold, access, technique }` |
| Lockout on that account at that PC | refused | not consulted: no sign-in is attempted (question 3) |
| Policy `remote: "blocked"` | refused | not consulted: the way in is the service, not remote sign-in (question 3) |
| Policy `accepts`, MFA (S8) | apply | do not apply; S8 states this from its side |
| Lock the session | allowed | refused with no code change: `session_lockable?` (`GM:3824`) admits only `password` and routed `credential` sessions |
| Desktop and folders at the PC's own keyboard | served, and the record drops `foothold` | refused; the sign-in screen is shown. The record is never settled, so it keeps `foothold` and an unplug still ends it |
| The PC's screen in the world | signed-in look | locked look |
| Source of a sign-in from its desktop to another PC | yes | yes |
| An NPC finishes a borrow of the PC | ends | ends; the card can be used again |
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
the session is not a claim, a relay or a `from` session.

The predicate reads neither the level nor whether the host has a screen, so a technique session
at admin on a headless host that blocks remote sign-in passes `desktop_request_allowed?`
through its own foothold, and by no other route: another foothold fails the predicate, and the
keyboard branch refuses a headless host and a technique session both. The privilege plan's
collect action is judged by this gate and can rely on that answer.

**The view offers what the server will serve, per foothold.** A row is built today with no
foothold: `host_row(pc)` (`NA:1043`), called from `network_rows(network_id)` (`NA:873`) and from
`down_blocks` (`NA:820`), and `network_rows` is called from `network_view` (`NA:770`) and
`network_blocks` (`NA:804`). All of those callers hold the foothold id of the view they are
building, so both methods gain it as a second argument: `network_rows(network_id, foothold_id)`
and `host_row(pc, foothold_id)`. `host_row` then lists a held session when

```ruby
(remote || technique_session_through?(session, foothold_id))
```

in place of today's bare `remote`, with its other conditions as they are (not a claim, not a
relay, not an expired credential session). The effect, on a host whose policy blocks remote
sign-in:

- in the view of the foothold the technique session came through, the row carries `remoteSignIn:
  false` and `session: { ..., via: "technique", openHere: true }`, with `access: "admin"` beside
  them when the level is admin;
- in the view of any other foothold, the row carries `remoteSignIn: false` and no `session`, as a
  blocked host does today. That view offers nothing, which is what the server would answer.

`openHere` is set by the server, only in that first case, and is the one thing the client reads:
`hostAction` (`NV:215`) keeps its order (`responding === false` first, so a powered-down host
still shows not responding) and its second line becomes "`remoteSignIn === false` and the session
is not `openHere`: `off`". A row with `openHere` falls through to the existing session line and
answers `open` or `locked`. The client holds no rule about footholds or `via`. `NetworkView#act`
opens with the view's own foothold (`NV:879`), which is the foothold the flag was computed for.
On a host that allows remote sign-in nothing changes: a technique session is listed in every
view that reaches the host and opens from any of them, as a password session does, and no row
carries `openHere`.

`down_blocks` passes its foothold too. It strips `session` and keeps the account name as
`heldAs`, so on a blocked host a greyed row names the kept account only in the view of the
session's own foothold. `desktop_refusal` (`NA:1036`) takes the same predicate, so a technique
session on a blocked host that is powered down answers `not_responding`.

**Folders.** A folder request that names a foothold is judged by `desktop_request_allowed?` and
follows the rule above. A folder request that names no route is different: `folder_route_allowed?`
(`GC:3185-3197`) passes it at any session that is not a relay, and `session_admits?`
(`GM:3260-3270`) then asks only that the session is held, unlocked and its route up. Left alone,
the folders of a blocked host would open under a technique session from any foothold or none.
`folder_route_allowed?` therefore gains one line: a request with no route at a session whose `via`
is `technique` is refused (403 `unreachable`). The remote desktop always sends its foothold, so
the player's own path is unaffected, and the line agrees with the keyboard rule above: with no
route there is no technique session to use.

What stays refused on a host whose policy blocks remote sign-in:

| Request | Answer, unchanged |
|---|---|
| Remote sign-in with a password, through any foothold (`POST /login`) | 422 `remoteBlocked` (`GM:3470`) |
| Remote account tiles (`GET /login_accounts` with `foothold`) | 422 `remoteBlocked` (`NA:923`) |
| Credential sign-in through a foothold or from a desktop | refused as today (`credential_login.rb:203`, `:219`, `:240`) |
| Desktop through a foothold with no session at the PC | 403 `no_session` (`GC:3146`) |
| Desktop through a foothold where the session is a password session made at the keyboard, a claim, or a credential session | 403 `unreachable` |
| Desktop for a technique session, naming a different held foothold that also reaches the host | 403 `unreachable`; that foothold's view lists no session on the row and offers nothing |
| A folder under the PC with no route, at a technique session | 403 `unreachable` |
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
  finding shows its alias, its evidence line and Confirm (evidence held) or Probe (not held, or
  none declared), then its status and needs, and Fixed when the finding carries `fixed`. A
  block shows its noise line from the keys of section 5.3, and Alerted once reached. A
  Techniques panel lists the held cards with name, summary and works-on line, from the
  `techniques` map the server sends for held cards. Select a finding, then a card, then Use;
  every control is a focusable button, so that path works from the keyboard, and dragging a
  card onto a finding calls the same function. Wherever a panel shows a session (the host
  row, the Techniques panel after a grant) it draws the session's access level from the
  `access` key: an "admin" tag when present, nothing otherwise. Pixel-art rules apply: 2px borders, pixel
  fonts, X closes. The view builds its rows as HTML strings through `escapeHtml` and `wordsHtml`
  (`NV:57`, `NV:71`); every new scenario or server string goes through the same two helpers or
  is set with `textContent`, and a hostile-string test covers each new field. A message an
  action leaves on screen (a refusal line, the line after an unplug) is handed to the renderer
  to draw; the shared `perform` path never writes it into the DOM itself.
- **Hooks for tests and for the skin.** Each ops control carries `data-action` naming the
  move, one of `sweep`, `scan`, `check`, `confirm` (Confirm and Probe are one action; the
  control also carries `data-quiet`), `select-finding`, `select-technique` and `use`. Each
  ops row carries what it is: `data-network-id` on a block, `data-host-id` on a host row,
  `data-service` on a tile, `data-finding` (the alias) on a finding, `data-technique` on a
  card. A selector is built from those alone, for example
  `[data-host-id="print01"] [data-action="scan"]`. These attributes are new and are put only
  on the controls and rows this plan adds, so the existing controls (Open, Sign in, Unplug)
  keep the selectors they have and no existing scenario's script changes.
- `hostAction` (`NV:215`) keeps `responding === false` as its first test and reads the server's
  `session.openHere` flag in its second (section 5.4). `getTestState` (`NV:920`) gains, per host
  row, `scanned`, `services` and `findings`, and the session's `access`; per finding its
  `alias`, `status`, `fixed`, `evidence`, `needs` and whether its confirm action is quiet;
  each with the selector of its action, built from the hooks above; per block `swept`, `ops`, `noise`, `noiseLimit` and `alerted`; and
  top-level `techniques` and `selectedFinding`, so a scripted playtest can drive and read every
  step.
- The test bridge's `window.__test.access.networkView(id)` (`systems/test-bridge/access.js:219`)
  returns the last fetched view as it stands; its doc comment and `docs/test-bridge.md` list
  only `{ id, via, name, network, hosts }`, so both gain `networks` (the blocks) and
  `techniques`, and a node test pins that the blocks come through. A playtest can then read
  `swept`, `noise` and the rows with the view closed.
- A new pure module `network-view/ops-model.js` holds row merging, the works-on line, need and
  evidence labels, alias lookup (alias to finding id, technique id to the held card's item id)
  and `REFUSAL_TEXT`, the one table from a `reason` code to words, with a neutral line for a code
  it does not know. No server answer carries display text for a refusal. The module imports
  nothing and touches no DOM, so the command-line skin can import the same file. The view imports
  it statically, so it joins the copy list of every node test that copies the view into a temp
  folder (section 11.3).
- `api-client.js`: `networkScan`, `networkCheck`, `networkConfirm`, `networkTechnique`. After
  every ops success the view runs its existing `GET /network` refetch, as it does after a
  sign-in or an unplug, and redraws from that. A route's own answer holds what the click needs
  at once (the changed row or finding, the noise line, the session to open); everything else a
  move changes, in this view or another foothold's, arrives by the refetch.
- Events through `eventDispatcher`, each also as `<name>:<id>`: `network_swept`
  (`networkId`), `network_host_scanned` (`hostId`), `network_service_checked` (`hostId`,
  `service`), `network_finding_confirmed` (`findingId`, `status`, `quiet`),
  `network_technique_used` (`findingId`, `techniqueId`, `grant`), `network_technique_refused`
  (`findingId`, `reason`, `noisy`), `network_alerted` (`networkId`). A scenario hangs objectives
  and NPC lines on these; NPC lines stay in scenario files.

### 5.6 Determinism

No rolls anywhere. Every answer is a function of the scenario and server state. Rows, services,
findings and needs are in id order.

## 6. Server routes

All four are `POST`, are in the `set_game` list and in `with_game_lock`, and live in a new
concern `app/models/break_escape/network_ops.rb`. None changes the inventory, so none takes the
`delta` flag the inventory routes use. S1 has one route, `/network/scan`, for its two moves:
a sweep and a host scan are one action at two sizes, with one policy method and the same
checks, and the parameter sent (`network_id` or `host_id`) says which.

**Authorisation.** Every game action calls `authorize @game` (`GC:1751`, `:1759`), which needs
a policy method named after the action. `app/policies/break_escape/game_policy.rb` gains four
methods beside the existing network ones (`:148-166`), each returning `show?` as those do:
`network_scan?`, `network_check?`, `network_confirm?` and `network_technique?`. The role test
`test/unit/break_escape/policy_test.rb` lists the network actions by name in `DEVICE_ACTIONS`
(`:124`); the four names join that list, so each role the test walks (owner, another player,
admin, account manager with and without the organisation) is asserted for each new action.

**A request that is not well formed is a 400.** As the existing network actions do (`GC:1762`,
`:1816`), each action answers `400 { success: false, reason: "bad_request" }` before the model
runs when a required parameter is missing, is not a string, or is longer than 200 characters,
and `/network/scan` does so when given both `network_id` and `host_id` or neither. That answer
depends on no id, so it tells nothing about what exists.

**One answer for everything the player has not earned.** A host id, a network id and a finding id
are server-only until the player earns them, and ids can be guessed from a prop's name, a
document or a lab sheet. If a route answered "out of reach" for a real id and "no such id" for an
invented one, it would say which hosts exist before any sweep. So every route's first check is
`ops_listed?` (section 5.2), and when it fails the answer is one fixed body, `404 { success:
false, reason: "not_found" }`, whatever the cause: an id that is a string but not of the id
form, a foothold not held, an id that does not exist, a network out of this foothold's reach, a host on a network
not yet swept, a host not yet scanned, a service name the host does not have, a finding not yet
made. The code builds that answer in one place and no branch adds a field to it. Only after the
target is known to be listed for the player do the other statuses appear: 403 `not_responding`
for a listed host that is powered down, and 422 for a refusal the player caused.

Every refusal is `{ success: false, reason }` with one of the statuses and codes below, and a
`need` or `noisy` key where the table says so. The server sends no display text: the client
turns `reason` into words with `REFUSAL_TEXT` (section 5.5). The 400 comes first on every route
and is left out of the table.

**The refusal codes, in one list.** The ops routes send twelve: `bad_request` (400),
`not_found` (404), `not_responding` (403), and with 422 `not_needed`, `not_confirmed`,
`false_positive`, `no_grant`, `fixed`, `wrong_class`, `wrong_product`, `wrong_version` and
`need_unmet`. The desktop route gains one, `network_only` (403, section 5.4). The thirteen
are kept in `test/fixtures/files/ops_refusal_codes.json`; the controller tests assert that no
ops answer carries a code outside it, and the node test that `REFUSAL_TEXT` has a line for
each.

| Route | Params | Checks in order | Writes and answer |
|---|---|---|---|
| `/network/scan` (sweep) | `foothold`, `network_id` | the network is listed through the foothold (404 `not_found`); it is a discovery network (422 `not_needed`) | adds to `opsDiscovered.networks`; log row; answers `{ success, network: { id, swept: true, hosts: [rows] } }`, the rows being the network's host and share rows |
| `/network/scan` (host) | `foothold`, `host_id` | the host is listed (404 `not_found`); it is responding (403 `not_responding`); it declares `services` (422 `not_needed`) | adds to `opsDiscovered.hosts`; log row; answers `{ success, host: <row with services> }` |
| `/network/check` | `foothold`, `host_id`, `service` | the host is listed, scanned and has that service (404 `not_found`); it is responding (403 `not_responding`) | records the service as checked and adds an entry and an alias for each finding not yet held (section 5.3); log row on the first check, whatever it found; answers `{ success, hostId, service, findings: [...] }` |
| `/network/confirm` | `foothold`, `finding_id` | the finding is held and its host listed (404 `not_found`); the host is responding (403 `not_responding`) | sets the status; adds one noise unless the evidence is held or the weakness is fixed; log row; answers `{ success, finding, quiet }`, and when it was a probe `noise`, with `alerted` and `serverGlobals` if this request reached the limit |
| `/network/technique` | `foothold`, `finding_id`, `item_id` | section 5.4: 404 `not_found`, 403 `not_responding`, then the 422 codes in order | section 5.4. Success: `{ success, grant: "session" or "credential", session? , endedPcIds?, keyringChanged? }`. Refusal: `{ success: false, reason, need?, noisy?, noise?, alerted?, serverGlobals? }` |

Responding is tested before `services` on a host scan, so a powered-down host answers the same
whether or not it has services, and nothing about its services is told before a scan succeeds.
A host on an open network counts as discovered and its network as swept, so `/check` works
there after a host scan; the host scan is the one step an open network still needs. A route
that changes the noise count carries the block's new `noise` (and `alerted`, and
`serverGlobals` when the limit was reached) so the view need not wait for its refetch.

**An exact repeat, and a stale id.** A repeat is the same request sent again with nothing
changed in between. A repeated sweep, host scan or check answers `already: true` with the same
fields (a check: the service's findings as they now stand, statuses and aliases kept); a
repeated confirm answers `already: true`, `quiet: true` and the settled finding. None writes
anything, adds noise or writes a log row. A repeated technique use after a success is the
repeat of section 5.4; after a refusal it is the same refusal again, which adds noise again if
it is a noisy one, and the log merges the row into the one before (section 13).

A stale id is one that was good and is not listed any more through the foothold named: the
foothold was unplugged, the pivot that reached the network was lost, or the id belongs to
another foothold's reach. It answers the one 404 on every route, because `ops_listed?` is asked
afresh on every request, and nothing learnt is lost: the network stays swept, the host scanned,
the findings and their statuses kept, and all show again when the id is reached again. A
session a technique granted through an unplugged foothold has already ended with it.

## 7. What reaches the browser, and what never does

| Data | Sent | When |
|---|---|---|
| `hosts`, `techniques` (top level), `services` on an object | never in the bootstrap or room data | deleted by name with `networks` and `network` |
| That a discovery network has hosts or shares, and how many | never before a sweep | the block arrives with `hosts: []` and `swept: false`, and no `ops` key |
| Whether a guessed host, network or finding id is real | never | every ops route answers the one 404 of section 6 until the id is listed for the player; an open share on an unswept network answers as an unknown id |
| That some host on an open or swept network declares services (`ops: true` on the block) | with the block | it says only that scanning is worth trying there; not which host, nor how many |
| A technique session's `via` | on the host row, in the session answer and in the reloaded sessions, once granted | |
| A session's `access` | `access: "admin"` on the host row, in the session answer and in the reloaded sessions, when the session's level is admin; no key otherwise | section 0 |
| Log rows (section 13) | never, by this plan | stored server-side in `opsLog`; the log feature's viewer is the only reader and has its own reach check |
| `openHere` on a session row | only in the view of the foothold a technique session came through, on a host that blocks remote sign-in | |
| A network's `noise`, `noiseLimit`, `alerted` | on the block of an open or swept network, by the rule of section 5.3; never on an unswept block | the `alert.sets` global reaches the client as any global does, when it is set |
| A finding's `alias` | with the finding | a counter of the player's own finds; it says nothing about what is unchecked |
| A finding's `evidence` (kind, label, held) | after the check, on weaknesses and decoys alike | the label is a name the scenario shows elsewhere |
| A host's `id`, `name`, `sprite`, kind | after its network is swept | `GET /network`, the sweep answer |
| A service's `name`, `label`, `port`, `product`, `version` | after the host is scanned | `GET /network`, the scan answer |
| That a service has weaknesses or decoys, and how many | never before a check | |
| A finding's `class`, `severity`, `summary` | after the check | check answer, `GET /network` |
| Whether a finding is real | after the confirm | |
| `falseBecause` | after the confirm, for a decoy | |
| `needs` (kind, label, met) | after the confirm, for a real finding | a need's `label` is a name the scenario already shows elsewhere, or the entry's authored `label`; never a password, a credential's secret or a global's name |
| `grants` | never; the player learns it by getting it | the session or keyring answer. That a weakness grants nothing is told only by the `no_grant` refusal, which needs a confirmed finding and a held card |
| `fixedIf` and its global | never; only `fixed: true` on a confirmed finding | an unconfirmed finding never carries it, so it cannot mark a finding as real |
| A technique's `name`, `summary`, `worksOn`, and `itemId` | only for techniques whose card item the player holds | `GET /network`, top-level `techniques: { "<techniqueId>": { name, summary, worksOn, itemId } }`. `itemId` is the held card to send to `/network/technique`: where several held items carry one technique, the first in id order. The key is left out of the answer when the player holds no card, so a scenario with no cards gets today's body |
| The technique id on a card item | with the item, wherever items ride | as `credential` does on an item today; the registry entry it names is not sent until the card is held |
| Weakness ids | inside finding ids, after the check | ids are author-chosen; the validator warns when a weakness id or a decoy id contains words such as "decoy", "fake" or "real" |

No-exposure tests: the bootstrap and every room answer contain no `hosts`, `techniques` or
`services` key and none of their strings; `GET /network` before a sweep names no host of a
discovery network and its block carries no `ops` and no noise key; before a host scan names no
product or version; before a check no class or summary; before a confirm nothing differs
between a decoy and a real finding except authored text, with the weakness fixed or not; a
technique not held is never named; the 400 body is the same for every route and every bad
parameter; a `no_grant` refusal carries `reason` and nothing else. The leak scanner gains a collector for these strings, staged
by what has been earned.

## 8. State and saved games

Four keys in `ACCESS_STATE_DEFAULTS` (`GM:3021`), all written only by the routes in section 6,
never read from a sync body, never sent whole: the bootstrap copies a fixed list of
`player_state` keys (the comment at `credential_login.rb:107`), and these four must not be
added to it. The defaults are `{}`, `{}`, `[]` and `{}`: each game
gets a shallow `dup` of the default (`GM:7576`), so a default must not hold a nested list that
games would share. `opsDiscovered` therefore starts empty and the writer creates its three lists;
readers treat a missing list as empty.

| Key | Shape | Bound | Sent |
|---|---|---|---|
| `opsDiscovered` | `{ "networks": [id], "hosts": [id], "services": ["<hostId>.<serviceName>"] }`; `services` is added by S2 and lists the services checked | networks in the scenario; 64 hosts; 8 services per host, so at most 512 `services` keys, about 41 KB with two 40-character ids each | not sent; it decides which rows `GET /network` builds |
| `opsFindings` | `{ "<findingId>": "<status><n>" }`, for example `"u3"`: one letter (`u`, `c` or `f`) and the alias number, given at the check as one more than the highest in the map | 64 hosts x 8 services x 8 entries in theory; the validator caps a scenario at 128 weaknesses plus decoys | not sent; findings ride on rows |
| `opsUsed` | `[findingId]` | number of weaknesses | not sent |
| `opsNoise` | `{ "<networkId>": n }`, n from 1 to 99 | networks in the scenario | not sent; `noise` rides on the block |

The alias number is kept in the value because the database's JSON column does not keep key
order, so "the order found" cannot be read back from the map itself.

`opsNoise` has no reset: no route lowers it, and the alert global, once set, is not cleared by
the engine.

The log rows of section 13 are stored by the log helper in its own keys (`opsLog`, `opsLogSeq`),
which that feature owns, bounds and documents; this plan adds none of its own for them.

Each route answers only the rows or the finding it changed. `GET /network` is the one whole read,
as today, on the view's existing refetch; its size grows with what the player has discovered and
is bounded by the caps above. The plan measures that answer for `test_ops_access` at full
discovery in the node test and the live proof. Nothing here is a client global, and no existing
sync section changes.

Reload: all four keys persist, so the view returns as it was, and a technique session comes back
with its level (section 5.4). An unplug ends sessions but leaves all four alone: what the
player has learnt about a network stays learnt, noise does not fade, and a network reached
again through a new foothold or a reopened pivot shows as it was left. A reset drops them with
the other access records. A game saved before this lands reads each as empty; with no
`discovery` network and no services in its scenario copy, nothing changes for it. Sessions with `via: "technique"`
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
| S1 | `definitions.item.properties`, beside `network` and `headless` (`SC:5525-5542`) | `services`, `x-serverOnly: true`, `$ref` to a new `definitions.service`. The item definition is open, so this declares the key (ending the unknown-key warning) and closes nothing |
| S1 | `definitions.service` | `name` (id pattern, max 40), `label` (max 40), `port` (integer 1 to 65535), `product` and `version` (1 to 40 characters); `name`, `port`, `product`, `version` required; array `maxItems: 8` |
| S2 | `definitions.service` | `weaknesses` (`maxItems: 4`, items `$ref` `definitions.weakness`) and `decoys` (`maxItems: 4`, items `$ref` `definitions.decoy`). `x-servedBy` gains `POST /network/check` and `/confirm` |
| S2 | `definitions.weakness` (closed) | `id` (id pattern, max 40), `class` and `severity` (the enums of section 0), `summary` (max 200), `evidence`, `needs`, `grants`, `fixedIf` (the same `oneOf` as `offWhen`: a global name or the requireGlobal map); `id`, `class`, `severity` required. `grants` is not required at any stage |
| S2 | `definitions.decoy` (closed) | `id`, `class`, `severity`, `summary`, `evidence` as on a weakness, and `falseBecause` (1 to 200 characters); `id`, `class`, `severity`, `falseBecause` required |
| S2 | `definitions.opsEvidence` (closed) | exactly one of `item` (`x-ref: item`, an item id), `itemType` (string), `credential` (`x-ref: credential`), `global` (the requireGlobal `oneOf`), as a `oneOf` over `required`; and `label` (plain text, 1 to 40 characters), required with `itemType` or `global` and refused otherwise |
| S2 | `definitions.opsNeeds` (closed) | `credential` (`x-ref: credential`), `item` (`x-ref: item`), `itemType` (string), `session` (enum `user`, `admin`), `global` (the requireGlobal `oneOf`), at least one of them; `item` and `itemType` not both (`not` over `required`); `label` under the same rule as on evidence. One `needs` map has one label, so the validator refuses `itemType` and `global` together in one map. The split of `item` from `itemType` is what lets the schema's reference check report a dangling item id |
| S2 | `definitions.opsGrants` (closed) | `session` (closed: `account` with `x-ref: npc`, `access` enum `user`, `admin`, both required) or `credential` (`x-ref: credential`); `minProperties: 1`, `maxProperties: 1`. Declared in S2 so the shape is fixed once; the validator refuses the key until S3 (section 3) |
| S2 | `networks.<id>` | `alert`: closed, `after` (integer 1 to 20) and `sets` (`x-ref: global`), both required |
| S3 | top level | `techniques`: id map, `x-serverOnly: true`, `x-servedBy: ["GET /network"]`, `maxProperties: 32`, keys at most 40 characters. Entry: `name` (required, max 40), `summary` (max 200), `worksOn` (required; `class` required, `product`, `versions` as 1 to 8 strings) |
| S3 | `definitions.item.properties`, beside `credential` (`SC:5158`) | `technique`: a key of the technique card registry, allowed only on an item of type `technique_card`; the description says so and names the pretext field of the same name as unrelated. It stays on the item the browser receives, as `credential` does; the registry entry it names does not |
| S3 | `credentials.<id>.proof` (`SC:293-306`) | `technique`: a finding id, with its own pattern (three ids joined by dots), which the description states. The description's list of proof kinds gains it |

The top level and `definitions.item` are open, so declaring a key there adds a known name and
nothing more; section 3 says what refuses each field before its stage.
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
cannot disagree about what a host or a finding id is. Two existing sections of
`check_network_model` learn about devices, each in the way that fits it. The rule at `VN:587`
(two hosts with one label) takes both kinds through `hosts_on`. The rule at `VN:361-364` asks
two different things: `carries` (does the network hold anything worth reaching) gains devices,
and `host_on` (is there a sign-in host to open a pivot session on) does not, because a device
has no session and nothing pivots through it.

Errors:

| Stage | Error |
|---|---|
| S1 | A `hosts` key equal to a room object id or a `resources` key (one id space), or longer than 40 characters |
| S1 | In a scenario with `logSources`: a network id, or the object id of a sign-in host with `services` or of a foothold device, longer than 40 characters (it would not fit a log row) |
| S1 | A `hosts` entry whose `network` is not a `networks` key; `services` on an object that is not a sign-in object |
| S1 | Two services with one `name` on a host; more than 8 services on a host; more than 64 hosts carrying services |
| S1 | `discovery: "scan"` on a network that has a `wifi` block or a jack but no host at all (a sweep would find nothing) |
| S1 | A `product`, `version`, `label` or host `name` that contains a password of the scenario (the rule `VN:519` applies to strings a foothold's view shows) |
| S2 | A weakness or decoy id used twice in one service; more than 128 weaknesses plus decoys in the scenario |
| S2 | `grants` or `needs.session` on a weakness ("not built yet: N15"), until S3 lands |
| S2 | `itemType` or `global` in an `evidence` or `needs` map with no `label`, or a `label` with neither; `itemType` and `global` together in one `needs` map; `itemType: "technique_card"` |
| S3 | An item with `technique` whose type is not `technique_card`, or an item of that type with no `technique` |
| S3 | `grants.session` on a `hosts` entry; `grants.session.account` that is not an account holder, or that the host's `access` list does not admit (the schema already refuses `grants` with both kinds or with neither) |
| S3 | `grants.credential` whose `connectsTo` PC blocks remote sign-in or whose policy does not accept `saved_connection` (the granted entry could never be used) |
| S1 to S3 | A field of this plan whose stage is not built yet (the table of section 3) |
| S1 | A `hosts` entry whose `sprite` names no PNG in `assets/objects/` |
| S2 | `alert.sets` naming an undeclared global, or one that anything else in the scenario sets (ink, an item, an event mapping): it is the server's to write |
| S2 | An `evidence` entry that names nothing (an item id or type no item has, an item that can never be held, an unknown credential, an undeclared global), or names an item only by display name |
| S2 | A `needs` entry that names nothing: an unknown credential id, an item id or type no item has, an item named only by display name, an undeclared global |
| S3 | `needs.session` on a weakness that does not grant a session on that host; `needs.session: "admin"` with `grants.session.access: "user"` |
| S2 | `fixedIf` naming a global that is not declared, or one whose starting value already holds with nothing in the scenario that can change it (the weakness can never be found) |
| S2 | A weakness on a network that no foothold's reach can include (the walk `VN:774` already computes) |
| S3 | `grants.credential` naming no `credentials` entry; the entry's `proof.technique` not naming this finding id, or a `proof.technique` naming no weakness; two weaknesses granting one credential; the entry's kind not `saved_connection` (the cracking feature adds `hash` to this rule when it is built) |
| S3 | A weakness with `grants` that no technique matches (`technique_matches?`), so it could never be used |
| S3 | A technique no item carries; an item whose `technique` is not a `techniques` key; more than 32 techniques |
| S3 | `worksOn.product` equal to no service's `product`; a `versions` entry equal to no version of that product |

Warnings:

| Stage | Warning |
|---|---|
| S1 | A host with `services` on an open network where nothing has a weakness (services that are only scenery are allowed, but it is usually a slip) |
| S2 | A weakness or decoy id containing a telltale word: `decoy`, `fake`, `false`, `real`, `true`, `bait` (the id reaches the browser inside the finding id) |
| S2 | `fixedIf` as the only thing between the player and a grant: it is a soft gate, because globals are client-synced, like an outage |
| S2 | `needs.global` or `evidence.global` naming a global the client can write (`server_owned_global_name?` false): a soft gate. For `needs`, the warning asks for an item or credential need beside it where the grant matters |
| S2 | Decoys on a network with no `alert` (a wrong guess there costs nothing); `evidence` on only the decoys or only the weaknesses of one service (its presence would tell them apart) |
| S2 | `alert.after` lower than the number of findings on the network that have no `evidence` and must be confirmed on the shortest route (the alert cannot be avoided) |
| S3 | A technique id containing a word of a product name in the scenario (the id rides on the card item before it is picked up) |
| S3 | A weakness with no `grants` in a scenario that has technique cards (a card on it gets the quiet `no_grant`; fine for a finding that is only there to be read or reported, so a warning) |
| S3 | `needs` on a weakness with no `grants`, in a scenario that has technique cards: the player is sent to fetch something that then opens nothing. A scenario with no cards, as at S2, gets no warning |
| S3 | A weakness that grants a session on a PC that a sign-in task, a capture proof of kind `session` or a keyring `session` proof also names: a card can complete that step without the password (section 5.4, question 5) |
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
| Host with no sign-in | `host_<id>`, kind `container`, label: name and "device" | from its network node, labelled `exposes`, as a sign-in host's lock is (`DG:778`) |
| Weakness | `weak_<findingId>`, kind `lock`, label: host name, service label and port, class and severity; a third line "fixed if <global>" when `fixedIf` is set, written as outage conditions are (`DG:653`) | on a sign-in host, from the network node, labelled with the service name (the host's own node `lock_<pcId>` means "signed in there", so it cannot be the source); on a device, from `host_<id>` |
| Technique card | `tech_<techniqueId>`, kind `key`, label: the technique's name; one source node per carrying item at its home, drawn as held-credential sources are (`DG:1639-1644`) | to every weakness it matches |
| Need | no new node | an edge into the weakness from `cred_<id>` (a credential), from the item's existing node, or from `lock_<pcId>` of the same host (a session, for a step up) |
| Grant of a session | no new node | from the weakness to `lock_<pcId>`, labelled `grants session`. The lock node already stands for "a session held there" and already takes a second way in from a credential (`DG:1656-1660`), so shares and pivots that hang from it (`DG:797-803`, `DG:1062-1075`) are reached by either route |
| Grant of a credential | no new node | from the weakness to `cred_<id>`; the credential block's `case` gains `when 'technique'` and draws nothing itself |
| Evidence | no new node | a soft edge into the weakness from the evidence item's or credential's node, labelled `confirms quietly`: it is never required |
| Alert | no new node | the network node's label gains "alert after N"; a `fixedIf` or `offWhen` on the alert's global is already drawn as that condition |
| Weakness with no `grants` | the weakness node, its label gaining "(report only)" | its incoming edges and no outgoing one. `lock_key_diff.rb` will list it as a lock that opens nothing, which is what it is; the label says so |
| Decoy | not drawn | it gates nothing |

The legend gains one line for a weakness and one for a technique card, added only when the block
ran, as the network notes are (`DG:2030-2035`). The kind is the third argument of `add_node` and
is written to the graph JSON as `kind`. `scripts/lock_key_diff.rb` classes nodes by that field
alone (`:188-189`), so it lists a weakness as a lock and a card as a key with no change to the
script, and a card that becomes unreachable, or a weakness that loses its last matching card,
shows in the diff. `key_free?` and `scrub_label` (`DG:562-596`) are applied to
every new label, so no label can carry a password.

## 10. Effect on existing scenarios

None. A scenario without the new fields takes the old path at every point this plan touches:

| Change | Why an existing scenario does not see it |
|---|---|
| `network_rows`, `host_row` and their callers | the foothold argument is read only by `technique_session_through?`; `discovery` absent means open; `hosts` is empty, so no device row; a host row gains `scanned` and `services` only after a host scan, which needs `services` to exist |
| `resource_admits_player?` | the added condition is true for every open network |
| `login_session_answer`, `session_for_client`, `host_row`, `pc-sessions.js` | `access` is sent and copied only when a session's level is admin, and nothing in an existing scenario can be admin (section 0) |
| The log helper calls | every call sits in one of the four new routes, which an existing scenario cannot get past a refusal; and the helper returns at once for a scenario with no `logSources` |
| `game_policy.rb` | four new methods; no existing method changes |
| `folder_route_allowed?`, the keyboard branch of `desktop_request_allowed?`, the new `network_only` handler in `loadLoginDesktop` | each new term asks for `via: "technique"`; the code is sent only for such a session, and the handler runs only on that code |
| `heldAtKeyboard`, the unplug button | no session an existing scenario can make has `via: "technique"`, so the added test changes no answer there, and the fallback's added relay test changes nothing the existing tests pin (`access-relay-desktop.test.mjs` uses the real `pcSessions`); the unplug guard moves into `perform` with the same pending label and notice, and `test/js/network-view.test.mjs` passes with no assertion changed |
| `core/game.js`, `public/break_escape/assets/objects/technique_card.png` | one more image loaded; no existing item has the type |
| `GET /network` top level and blocks | `techniques` is sent only when a card is held; `swept` only on a discovery network, `ops` only where a host has services, and the noise keys only by the rule of section 5.3, which needs an `alert` or a noise count, neither of which an existing scenario can have |
| `host_reachable_through?`, `from_route_refusal` | the added condition is true for every open network |
| `desktop_request_allowed?`, `desktop_refusal`, `host_row`, `hostAction` | each new term asks for `via: "technique"` or the `openHere` flag that follows from it, which only `POST /network/technique` causes |
| `start_login_session!` | two keyword arguments that default to nil and write nothing |
| `PROOF_KINDS`, `credential_proof_holds?` | a new kind no existing credential uses |
| The four routes | with nothing declared: a sweep of a reached network answers 422 `not_needed`, as does a host scan of a listed, responding host with no `services`, and neither records anything; check, confirm and technique answer 404 |
| State | four keys that default empty and are never sent |
| Server-owned globals | only a global named by an `alert` joins them |
| Bootstrap and room data | two more names in the withheld lists, for keys no existing scenario has |
| Schema, validator, graph | new optional properties; `check_network_ops` returns at once when there are no `hosts`, `services` or `techniques`; the graph block does not run |

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
| `break_escape/policy_test.rb` (extended) | S1 to S3 | the four new policy methods, added to `DEVICE_ACTIONS` as each stage adds its action, so every role the test walks is asserted for each |
| `ops_log` event registrations | S1 to S3 | the log feature's own spec walks `EVENTS` and `KINDS` in `lib/break_escape/ops_log_events.rb`; each stage's entries (section 13) must pass it |

### 11.2 Controller (`test/controllers/break_escape/`)

Every test drives the real routes on a game built from a fixture scenario and reads
`player_state` back from the database. The fixture scenarios declare a `logSources` source that
takes this plan's events, and each stage's tests assert its own log rows there (section 13):
one row on the validated branch, none on a 400, a 404 or an exact repeat, and no row at all for
a scenario with no `logSources`.

| File | Stage | Covers |
|---|---|---|
| `network_scan_test.rb` | S1 | each check of `/network/scan` in order, with its status and reason; the 400 for a missing, non-string or over-long parameter and for both or neither of `network_id` and `host_id`; a powered-down host answering `not_responding` with and without services; the `network_swept` and `host_scanned` rows, once each; a sweep through a foothold that does not reach the network (404); `already` carrying the same fields; `GET /network` before and after; a second network swept only after a pivot session; discovery kept across an unplug and a new foothold |
| `network_discovery_enforced_test.rb` | S1 | on an unswept discovery network, with a PC id the client was never sent: remote sign-in, account tiles, desktop, credential sign-in through a foothold, sign-in from a held desktop, and the keyring's offered routes, each refused as out of reach; each allowed after the sweep; keyboard sign-in at that PC allowed throughout; the same requests on an open network unchanged; an open share on the unswept network answering `GET /container` as an unknown id, and served after the sweep |
| `network_ops_indistinguishable_test.rb` | S1 to S3 | for each of scan (sweep and host), check, confirm and technique: the answer for a real id the player has not earned (a network out of reach, a host on an unswept network, a host not scanned, a real finding id never checked, a finding whose host is no longer listed) equals, status and body byte for byte, the answer for an invented id, a string that is not of the id form and a foothold not held; and a stale id (good before an unplug or a lost pivot) answers the same |
| `network_noise_test.rb` | S2, S3 | the noise rules of sections 5.3 and 5.4, each rule one test, for a weakness and a decoy alike; every card in the scenario tried on a finding with no `grants` leaves the count where it was; a quiet refusal saves the game only while the helper's result is `stored?`: with `save_limit: true` passed (limit 10 in `EVENTS`), the first ten quiet refusals at a host in a five-minute window of server time save, whatever the card or finding, the eleventh and every later one in that window do not (the first after the window ends does again), and none does with no log source; noisy refusals at the same host before and between the quiet ones do not move the point at which the eleventh quiet refusal is dropped; the limit sets the global once, that answer carries `alerted` and `serverGlobals`, one `network_alerted` row is written, and a sync body can neither set nor clear the global nor write `opsNoise`; a weakness with `fixedIf` on the alert global is fixed from that request on; a network with no `alert` counts and sets nothing; evidence forged into the inventory does not make a confirm quiet; a noisy refusal sent twice counts twice; the count stops at 99; noise kept across an unplug and a reload |
| `network_findings_test.rb` | S2 | aliases given in the order found and kept across a reload; a check repeated after a confirm keeps the status and the alias and answers `already: true`; a first check of a service with no weakness or decoy, and of one whose only weakness is fixed, answers no findings and no `already`, adds the service to `opsDiscovered.services` and writes one `service_checked` row, and its repeat answers `already: true` with no row; a repeat check after the weakness has become unfixed adds the finding, saves, answers no `already` and writes no second row, and the check after that answers `already: true`; a second service's check carries on the alias count; a host with services and no finding held carries no `findings` key, scanned or not; the 400s and each 403 `not_responding` of `/check` and `/confirm`; the `service_checked` and `finding_confirmed` rows; check before scan (404); a check's answer with a decoy and a weakness built from the same keys in id order; confirm for each; an invented finding id (404); a weakness whose `fixedIf` holds left out of a check; one already confirmed carrying `fixed: true`, and one found but unconfirmed carrying no `fixed` key and the same keys as a decoy; an `itemType` need met only by an unforged held item whose id is an authored item of that type; the authored `label` shown for an `itemType` and a `global`, and the global's name in no answer; `met` recomputed on each read as an item is picked up and a credential earned |
| `network_technique_test.rb` | S3 | section 5.4, each rule one test: every refusal in its fixed order with what it writes and its `technique_refused` row, both grants with their `technique_used` row, and the repeat for a session and for a credential. Beyond that section's text: with two footholds that both reach the host, a use through the second being a new use that runs every check and moves the session to that foothold; a grant again after the session ended; `endedPcIds` when the grant replaces a pivot session; the step up replacing the record in place and keeping `foothold`, from a technique session and from a password session at `user`; `signedInPcs` gaining the PC; `access: "admin"` in the answer, in `GET /scenario` after a reload and on the host row for a session at admin, and no `access` key for a technique session at user or for a password, claim or credential session; `GET /network` `techniques` absent with no card held and carrying `itemId` (first in id order of two held cards) otherwise |
| `network_technique_blocked_host_test.rb` | S3 | the hostile test for the changed access check. On a host with `remote: "blocked"`: every row of the "stays refused" table in section 5.4, each with a session made through the real routes; then the technique session opens the desktop and its folders through its own foothold and through no other. With two footholds that both reach the host: the first foothold's view lists the session with `openHere` and the second's row has no session, so no view offers an Open the server refuses; a folder request with no route is refused; a desktop request with no route from beside a PC the player can walk to, on a blocked host and on one that allows remote sign-in, answers `network_only` and the session is still held. On a headless blocked host with the technique session at admin, `desktop_request_allowed?` is true through the session's own foothold and false through another held foothold, a `from` route and no route. Host off answers `not_responding`; an unplug ends it and the next request is `no_session`. On a host that allows remote sign-in: a password session's desktop behaves as before |
| `network_technique_hostile_test.rb` | S3 | a card item id the player does not hold; an item the client forged into its inventory; an inventory entry whose `technique` field the client added or changed (the server reads the authored definition); an item matched only by `name`; a finding id of another host; a foothold id not held; a sync body that writes `opsDiscovered`, `opsFindings`, `opsUsed` or a session with `via: "technique"`; non-string and over-long parameters. Each is refused or ignored and leaves the state untouched |
| `network_technique_session_test.rb` | S3 | the table in section 5.4 row by row: lock refused, keyboard desktop refused and `foothold` kept, sign-in from its desktop to another PC, an NPC finishing a borrow ending it and a repeat use granting it again, an NPC guest session ended by the grant, pivot, share mapping, `needsSession` for an implant, outage and host off kept then refused then working again, `fixedIf` turning true afterwards, reload |
| `network_ops_no_exposure_test.rb` | S1 to S3 | the no-exposure list of section 7 at each step of a full run, over the bootstrap, every room, `GET /network`, `GET /keyring`, `GET /container` and all four ops answers; the payload scan over the same answers |
| `network_ops_state_delta_test.rb` | S1 to S3 | no ops key appears in any sync answer; each route's answer holds only what it changed; the size of `GET /network` at full discovery of `test_ops_access` is under 16 KB |
| `network_ops_unchanged_test.rb` | step 1 | section 10, part 1 |
| `keyring_route_test.rb` (extended) | S3 | a `technique` proof holds only after the use; the entry is absent from `GET /keyring` before |

### 11.3 Node (`test/js/`)

| File | Stage | Covers |
|---|---|---|
| `ops-model.test.mjs` | S1 to S3 | row merging, the works-on line, need and evidence labels, alias and item id lookup, every code in `ops_refusal_codes.json` (section 6) present in `REFUSAL_TEXT`, unknown codes mapped to a neutral text |
| `pc-sessions-access.test.mjs` | S3 | `load` and `publicSession` keep `access` when present and add nothing when absent; `heldAtKeyboard` false for a copy with `via: "technique"` and for a relay copy, true for a password copy, and the same three answers from the `unlock-system.js` fallback for a mirror without the method; `keyboardSession` null for a technique copy; `screen-states.js` keeps the locked look |
| `container-network-only.test.mjs` | S3 | `loadLoginDesktop` called with no route (no `remote`, `fromRoute` or `relay`) against a stubbed 403 `network_only`: the client still holds the session, `dropLocal` was not called, no `pc_signed_out` was emitted, no message was shown and the sign-in screen was opened; the same with `params.fromReturn` set; a plain 403 with no reason on the same path still drops the copy, as today |
| `technique-card-item.test.mjs` | S3 | a picked-up `technique_card` gets a tray slot and a pickup toast, from a room, a container and an NPC gift; a `notes1` item in the same test gets neither, which pins why the card has its own type |
| `network-view-ops.test.mjs` | S1 to S3 | the actions each row state offers, found by their `data-action` and row hooks; no such attribute on any control of a view built from an existing scenario's answer; select-then-Use and a drag sending the same request; the "admin" tag drawn from `access` and absent without it; Fixed drawn only from `fixed`; `hostAction` for a blocked-host row with and without `openHere`, for a powered-down row that has it (not responding), and unchanged for every existing row shape; Confirm against Probe by `evidence.held`; the noise line; `getTestState` fields; for each action the guard holds at that stage (unplug, sweep and scan at S1; check, Confirm and Probe from S2; use from S3), the control disabled in the same tick as the press, before any `await`, while its request is pending, and a second press making no second call (one call counted); a refetch that lands while a request is pending keeping that control disabled; a `use` of another card on the same finding, or of the same card on another finding, making its own call; the unplug's pending label and notice unchanged and drawn by the renderer; the refetch after each ops success; the test bridge's `networkView` returning the blocks; hostile strings in host names, products, summaries, reasons and technique names rendered as text |
| `api-client-network-ops.test.mjs` | S1 to S3 | the four calls: path, body, error mapping, and no retry of a refused or failed request |
| `validator-network-ops.test.mjs` | S1 to S3 | one fixture per error and warning of section 9.2, and a clean fixture per stage |
| `dungeon-graph-ops.test.mjs` | S2, S3 | the nodes and edges of section 9.3 for `test_ops_access`; no password in any label |
| `lock-key-diff.test.mjs` (extended) | S3 | a removed card and a removed weakness show in the diff, with the script itself unchanged |
| `ops-unchanged-validator.test.mjs` | step 1 | section 10, part 2 |

**Harness copy lists.** There is no central list: each node test that copies part of
`public/break_escape/js` into a temp folder names its own files. `ops-model.js` is a static import
of the view, so it is added to the copy list of every test that copies
`network-view-minigame.js`: today `network-view.test.mjs`, `minigame-consoles-fit.test.mjs`,
`pc-monitor-frame.test.mjs` and `escaping-shared-helpers.test.mjs`. The build step greps
`test/js` for `network-view` again before it finishes, since other branches add tests.
`ops-model.js` imports nothing, so it adds no second-level entries, and
`container-minigame.js` does not import it (section 5.4), so the tests that copy that file need
no change. `container-network-only.test.mjs` takes its copy list from
`access-from-desktop.test.mjs`. `bin/test-js` retries a file
only for a module missing from the temp folder under load; a file that is really absent from a
copy list fails every attempt.

### 11.4 Feature scenarios and scripted playtests

Three small scenarios under `scenarios/`, each with `mission.json`, a generated dungeon graph and
a `PLAYTEST.md` in the layout of `scenarios/test_access_networks/PLAYTEST.md` (setup, harness
notes, then one subsection per beat). A beat is driven through `window.__test`, reads the view
through the minigame's `getTestState` while it is open and through
`window.__test.access.networkView(id)` when it is closed, and captures every response for the
leak scanner. Beats name actions (sweep, scan, check, confirm, probe, use), never controls, and
a script finds each action by its `data-action` and row hooks (section 5.5), so the same beats
run against either renderer. Scripted runs go to Haiku; a "stuck" claim is checked on Sonnet. Headless runs use
`window.__test.throttleFps(20)`.

**The server-side reader.** The "server records" column is read after the run with
`bin/rails runner tools/playtest/verify-run.rb <game_id> --access`
(`scenarios/test_access_networks/PLAYTEST.md:43`). Its `ACCESS_KEYS` list (`:68`) decides
whether the access section prints, and `access_section` (`:73`) prints one labelled line per
key, each built by a small mapper. The change is about 25 lines: the four ops keys join
`ACCESS_KEYS`, and four lines are added, each in id order: `opsDiscovered` (networks, hosts, then
checked services), `opsFindings` (alias, id and status word), `opsUsed`, and `opsNoise` (network and
count). The session line gains the `access` and `technique` keys when a record has them. Log
rows are read with the `--ops-log` switch the log helper stage adds to the same script.

**Hostile beats** are sent from the page with `eval` and `fetch` carrying the `X-CSRF-Token`
header, as `scenarios/test_access_habits/PLAYTEST.md:308` does, and each response is saved to
the run's responses file so the leak scan covers it.

**A beat that changes the world with the view closed** (picking something up, flipping a
switch) ends with "reopens the view", which is one fresh `GET /network`. The view's five-second
refetch runs only while it is open, so no beat waits on it.

All names are invented. Each scenario has two jacks, so that a second foothold exists for the
hostile beats, a wall switch that sets a global, for `offWhen` and `fixedIf`, and one
`logSources` source with no `where` that lists this plan's events by exact name.

**`test_ops_scan` (S1).** A lobby with two jacks and a note holding one password. `guest_lan` is
open: one PC with a service. `office_lan` is `discovery: "scan"`: a printer and a camera recorder
(devices), `files01` (headless sign-in) and `desk01` (a sign-in PC in a locked room).
`plant_lan`, also discovery, links to `office_lan` and holds a door controller.

| Beat | The player does | The browser receives | The server records |
|---|---|---|---|
| 1 | Plants the device in jack B, opens the view | one `office_lan` block: `swept: false`, no rows, no `ops` and no noise key, the sweep action offered; no host name, count or product anywhere | the foothold; ops keys empty |
| 2 | (hostile, by direct request) remote sign-in, tiles and desktop for `desk01`; a host scan of the printer's real id and of an invented id; a sweep of `plant_lan` and of an invented network id; `GET /container` for the open share on `office_lan` | the existing routes refuse as out of reach; the four ops requests get one identical 404; the share answers as an unknown id | nothing |
| 3 | Sweep | four rows: two devices, two PCs; no services | `opsDiscovered.networks` has `office_lan`; log row `network_swept` |
| 4 | Scan on the printer, then again | two service tiles with name, port, product, version; the repeat has `already: true` and the same fields | the printer in `opsDiscovered.hosts`, once; one `host_scanned` row |
| 5 | Flips the switch, Scan on the camera recorder | 403 `not_responding`; the row shows powered down | nothing |
| 6 | Signs in to `files01` from the view with the note's password | the desktop; back in the view a `plant_lan` block, unswept | the session with its foothold |
| 7 | Sweeps `plant_lan`, scans the door controller | its row, then its services | both recorded |
| 8 | Reloads the page, opens the view | the same blocks, rows and tiles as before the reload | unchanged |
| 9 | Unplugs, plants in jack B again | sessions ended; `office_lan` still swept, tiles still shown; `plant_lan` gone until the pivot is opened again, then shown swept | sessions gone; `opsDiscovered` unchanged |
| 10 | Plants in jack A (`guest_lan`) | the PC listed at once with the scan action offered and no sweep action | nothing new until Scan |
| 11 | End of run | leak scan: no host, product or version string before the beat that earned it | |

**`test_ops_findings` (S2).** One discovery network with `alert` after 3. No weakness has
`grants` or `needs.session`, so the scenario passes the validator with only S1 and S2 built.
The printer's admin page has a weakness that needs a manual (an item in a cupboard) and a
decoy; the decoy's evidence is a maintenance log on a desk and the weakness's is an installer's
sheet in the same cupboard. The file server's first service has a weakness with `fixedIf` on
the switch's global, and its evidence is a note on the desk. The camera recorder has only a
decoy, with no evidence. A second service on the file server has two weaknesses with no
evidence: one needs a credential the scenario never gives, the other has `fixedIf` on the
alert's global (the staff patch it when the alarm goes).

| Beat | The player does | The browser receives | The server records |
|---|---|---|---|
| 1 | Plants, sweeps; (hostile) checks the admin page before any host scan | 404 | nothing |
| 2 | Scans the printer, checks the admin page | two findings, both `unconfirmed`, aliases `f1` and `f2`, the same keys on each, in id order, each with an evidence line not held; no needs, no reason, nothing naming a decoy | two entries `u1`, `u2`; one `service_checked` row |
| 3 | Takes the maintenance log, reopens the view, confirms the decoy | the confirm action is marked quiet; status `false` and the authored reason; `quiet: true`; no noise on the block | entry `f`; no `opsNoise`; a `finding_confirmed` row |
| 4 | Presses Probe on the other without its evidence, then Check on the admin page again | status `confirmed`; needs: the manual, not met; the block shows noise 1 of 3; the repeat check answers `already: true` with both statuses and aliases kept | entry `c`; `opsNoise` 1; no second `service_checked` row |
| 5 | Takes the manual from the cupboard, reopens the view | the same finding, the need now met | nothing: `met` is computed on read |
| 6 | Takes the note, scans the file server, checks its first service, confirms its finding | a confirmed finding, quiet; noise still 1 | recorded |
| 7 | Flips the switch (the fix), reopens the view | that finding shows Fixed | status still `c`; `fixed` is computed on read |
| 8 | Checks the camera recorder, probes its finding (no evidence declared) | one finding, then `false`; noise 2 of 3 | recorded |
| 8a | Checks the file server's second service (two findings) and probes the one that needs the credential | noise 3 of 3, Alerted; the answer carries `alerted` and the global in `serverGlobals`; the NPC line hung on `network_alerted` plays; the second finding, whose weakness the alert has fixed, is still unconfirmed and carries no `fixed` key and no other change; confirmed (quietly) it then shows Fixed | `opsNoise` 3; the global true; one `network_alerted` row |
| 8b | (hostile) posts a sync body clearing the alert global and writing `opsNoise` | ignored | unchanged |
| 9 | (hostile) confirms an invented id and the id of a weakness never checked | the same 404 for both | nothing |
| 10 | Reloads | every finding as it was | unchanged |
| 11 | Run B, fresh game: flips the switch first, then checks the file server's first service, then checks it again | no finding for the fixed weakness: an empty `findings` list and no `already`; the repeat answers `already: true` | no `opsFindings` entry; the service in `opsDiscovered.services`; one `service_checked` row |
| 12 | End of each run | leak scan: no class or summary before a check; no reason or need before a confirm; no `grants`, `fixedIf` or global name ever | |

**`test_ops_access` (S3).** `office_lan` (discovery, `alert` after 6, with a `fixedIf` on the
alert's global on a spare weakness so the consequence is seen) holds the printer, `files01`
(headless, remote sign-in allowed), `vault01` (headless, policy `remote: "blocked"`) and `desk01`
(a PC in a room the player can walk into, with one weakness that grants a session). `plant_lan` links
to it and holds one PC. Cards: one for factory accounts (in a folder in the lobby), one for the
file service's product and versions (on an NPC, handed over in dialogue), one for another class
and one for the right product at the wrong version (both in a drawer). The printer's weakness
needs the manual and grants a saved connection to `files01`. `vault01` has two weaknesses: one
grants a session with `access: "user"`, the other needs that session and grants `admin`.
`files01`'s file service has a weakness with `fixedIf` on the switch's global that grants a
session as a named account with `access: "user"`. The spare is the one weakness with no
`grants`, the report-only finding: once the alert has fixed it, a card on it is still answered
`no_grant`, because that check comes before `fixed`. The findings are seven: the printer's
weakness and its decoy, `files01`'s, `desk01`'s, `vault01`'s two and the spare. Evidence for
the first four lies in the lobby; the last three have none and can only be probed.

| Beat | The player does | The browser receives | The server records |
|---|---|---|---|
| 1 | Plants in jack A, sweeps, scans and checks everything | seven findings, all unconfirmed; the Techniques panel lists only the card held so far, with its works-on line | as in the first two scenarios |
| 2 | Uses the held card on an unconfirmed finding | 422 `not_confirmed`, not noisy; the view shows the text `REFUSAL_TEXT` has for the code | a `technique_refused` row; nothing else |
| 3 | Collects the four pieces of evidence and confirms those findings, probes the other three; uses the card on the printer's decoy | noise 3 of 6 after the probes; then 422 `false_positive`, `noisy: true`, noise 4 of 6 | `opsNoise` 3, then 4; a `technique_refused` row |
| 4 | Collects the drawer's cards; uses each on `vault01`'s first weakness, confirmed in beat 3 | 422 `wrong_class`, noise 5; then 422 `wrong_version`, noise 6 of 6, `alerted`, the global in `serverGlobals`; on reopening the view the spare finding shows Fixed | `opsNoise` 6; the global true; one `network_alerted` row |
| 5 | Uses the factory accounts card on the printer's weakness without the manual | 422 `need_unmet`, naming the manual, not noisy; noise still 6 | a row only |
| 5a | Uses every held card on the spare finding (confirmed in beat 3, shown Fixed since beat 4, no `grants`) | 422 `no_grant` each time, never `fixed`, not noisy, with the "nothing to gain here" line; noise still 6 | one `technique_refused` row per card (the `technique` detail differs), a repeat of the same card merged into its row; each request saves only while the helper's result is `stored?`, which holds throughout: the run sends fewer than ten quiet refusals in all, so no host reaches its limit |
| 6 | Takes the manual, uses the card again, then once more | success, `grant: "credential"`, `keyringChanged`; the keyring now lists the saved connection, which the answer to `GET /keyring` did not hold before; the repeat answers `already: true` | the finding in `opsUsed`, once; one `technique_used` row |
| 7 | Opens the saved connection | the `files01` desktop | a `credential` session with the foothold |
| 8 | Tries remote sign-in to `vault01` from the view | "Remote sign-in off" | nothing |
| 9 | Talks to the NPC, receives the product card, uses it on `vault01`'s first weakness | success; the `vault01` desktop opens; the row shows the session with `openHere` and no `access` key (user level) | `sessions.vault01`: `via: technique`, the foothold, `access: user`, the finding id; `signedInPcs` has `vault01`; a `technique_used` row as the account |
| 10 | Plants a second device in jack B and opens its view; (hostile) requests the `vault01` desktop naming that foothold, a `vault01` folder with no route, and a use with a card id not held; posts a sync body with the ops keys set | the second view's `vault01` row has no session and no Open; 403 unreachable twice; 404; the body ignored | nothing changed |
| 10a | Uses a fitting card on `desk01`'s weakness from the jack A view, closes the desktop, walks to `desk01` and clicks it. Then the script edits the `via` of its client copy of the `desk01` session to `password`, so `heldAtKeyboard` answers true, and clicks `desk01` again | the grant succeeds; the first click shows the sign-in screen with no desktop request sent, and the screen in the world still looks locked. The second click sends the no-route request through `loadLoginDesktop`: 403 `network_only`, the sign-in screen opens, the client still holds the session and no `pc_signed_out` fires. After a reopen of the jack A view its `desk01` row still opens the desktop | `sessions.desk01` a technique session through jack A, unchanged by either click |
| 11 | Uses the first card that fits on the step-up weakness | success; the row and the session answer now carry `access: "admin"` | the record replaced: `access: admin`, same foothold; a `technique_used` row with `access: admin` |
| 12 | Opens the view | a `plant_lan` block reached through `vault01`; sweeps it | recorded |
| 13 | Tries to lock the `vault01` session | refused | unchanged |
| 14 | Reloads | sessions, findings with their aliases, noise, cards and keyring as before; the `vault01` session still carries `access: admin` | unchanged |
| 15 | Flips the switch that fixes `files01`'s file service, tries the product card on its confirmed finding, which has `grants` and so passes the `no_grant` check | 422 `fixed`, not noisy; the `vault01` session still opens | a row only |
| 16 | Unplugs the jack A device | `vault01`, `files01` and `desk01` sessions ended, `plant_lan` gone; a desktop request answers `no_session` | sessions gone; `opsUsed` and the keyring entry kept |
| 17 | Plants again, uses the card on `vault01`'s first weakness | the session again | a new record |
| 18 | End of run | leak scan clean; `GET /network` at full discovery measured and under 16 KB | |

The scenario also carries one NPC line on `network_technique_used` and one objective per event of
section 5.5, so the events are proved to drive a task. The line is in the NPC's file.

**Leak scanner.** `tools/playtest/lib/access_leak_scanner.rb` gains `collect_ops_secrets`, beside
`collect_network_secrets` (`:494`). It collects, with the same "not already in room text" rule:
host names of `hosts` entries and of sign-in hosts on discovery networks, the names of shares on
discovery networks, products, versions, service labels, summaries, `falseBecause` texts, technique names and summaries, and the global
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
- S2 also: Probe against Confirm, the noise line from "0 of 3" rising, and Alerted with the
  scenario's consequence visible; a finding fixed by the alert showing Fixed only after its
  confirm.
- S3: a card picked up in the world appearing in the tray with its toast; select-then-Use by
  keyboard alone; the refusal texts, with a use repeated to show no second session; the log
  rows of the run read back with `verify-run.rb`; the keyring gaining its entry; the desktop on the blocked host opening
  from the Use control, closing on unplug, and the same request then refused; with a second
  foothold planted, its view showing no Open on that host; the sign-in screen at `desk01`'s
  keyboard while a technique session is held there.

The S3 proof also runs the three existing network playtests' first beats in the same browser, as
a check that the unchanged view still loads and acts on an old scenario.

After S3, a screenshot review of the view at each state (empty, swept, scanned, findings, a card
selected, a refusal) goes to the user before the feature is called done.

## 12. Build steps and shared files

### 12.1 Steps

**Build order: the log helper stage, then S1, then S2, then S3.** The log feature's first stage
(the `OpsLog` concern with `write_log_row!` and its event list; no viewer) lands on main before
step 2. From then on each stage of this plan registers its own events, writes its own rows
through the helper in the model method that does the work, and asserts them in its own tests.
No stage waits for the log viewer, and none leaves rows for a later stage to add.

Each step is one commit on a feature branch cut from main, committed before its tests are run in
the shared tree. Steps 2 to 5 are S1, 6 to 8 are S2, 9 to 13 are S3. A stage is merged only at
the hash its full suites, scripted playtest and live proof ran on, and main is merged back into
the branch after each landing.

| Step | Stage | Work | Proof before moving on |
|---|---|---|---|
| 1 | before S1 | The unchanged-behaviour fixtures and tests of section 10, parts 1 and 2, recorded on main | they pass on main |
| 2 | S1 | Schema (9.1, S1 rows); `NetworkModel` helpers; `check_network_ops` S1 rules and the not-built-yet table; the two withheld-list names | unit and validator node tests; step 1 tests |
| 3 | S1 | `network_ops.rb` with `ops_listed?`, the one 404 answer, the 400, `scan_network!` and `scan_host!`; `opsDiscovered`; the route, both controller lists, `network_scan?` in the policy and its name in the role test; the `network_swept` and `host_scanned` events and their calls; `network_rows` and block changes; the condition in `host_reachable_through?`, `from_route_refusal` and the foothold branch of `resource_admits_player?` | `network_scan_test`, `network_discovery_enforced_test`, `network_ops_indistinguishable_test`, no-exposure and delta tests; step 1 tests |
| 4 | S1 | Client: `ops-model.js`, the scene's `perform` path and pending guard with the unplug guard folded in, Sweep and Scan in the view, the row icon, `api-client.js`, events, `getTestState`, the test bridge's `networkView` comment and test, copy lists | node tests; `bin/test-js` whole |
| 5 | S1 | `test_ops_scan` with its `PLAYTEST.md`, graph and leak collector; the ops lines in `verify-run.rb`; docs (N13 in `docs/ACCESS_AND_NETWORKS.md` and the `README_scenario_design.md` index, the `networkView` shape in `docs/test-bridge.md`) | scripted playtest, live proof, full suites; land S1 |
| 6 | S2 | Schema (S2 rows); model helpers; validator S2 rules; `check_service!`, `confirm_finding!`, `opsFindings` with aliases; evidence; `add_noise!`, `opsNoise`, `alert` and its server-owned global; the two routes with their policy methods; the `service_checked`, `finding_confirmed` and `network_alerted` events and calls; findings on rows, noise on blocks | `network_findings_test`, `network_noise_test`, and the extended exposure and indistinguishable tests |
| 7 | S2 | Client: Check, Confirm and Probe, the findings panel with evidence, needs and reasons, the noise line; graph: weakness nodes (9.3, without cards) | node tests |
| 8 | S2 | `test_ops_findings`, playtest, leak collector steps, docs (N14) | scripted playtest, live proof, full suites; land S2 |
| 9 | S3 | Schema (S3 rows); `techniques` helpers; validator S3 rules, among them the card type rule, the `connectsTo` checks on a granted credential, and the warnings for a weakness with no `grants`, for `needs` on one, and for a card that can stand in for a sign-in; `PROOF_KINDS` and `credential_proof_holds?`; the `technique_card` type: the placeholder PNG, its `load.image` line, the grep of section 4.3 | unit, validator and keyring tests; `technique-card-item.test.mjs` |
| 10 | S3 | `start_login_session!` keywords; `access` through `login_session_answer` and `session_for_client`; `use_technique!` with the repeat test and noise on the four noisy refusals; `opsUsed`; the route and its policy method; the `technique_used` and `technique_refused` events and calls; the credential grant; `techniques` with `itemId` on `GET /network` | `network_technique_test`, `network_technique_hostile_test`, `network_noise_test` |
| 11 | S3 | The access check changes alone: `technique_session_through?`; its use in `desktop_request_allowed?` and `desktop_refusal`; the foothold argument of `network_rows` and `host_row` with `openHere`; the keyboard refusal with its `network_only` code, and the handler for that code in `loadLoginDesktop`, ahead of the `fromReturn` handler and the catch-all; the no-route line in `folder_route_allowed?` | `network_technique_blocked_host_test`, `network_technique_session_test`, `container-network-only.test.mjs`, and every existing network and keyring controller test, unmodified |
| 12 | S3 | Client: the Techniques panel, Use, `REFUSAL_TEXT`, `hostAction`, `access` in `pc-sessions.js`, the `via` test in `heldAtKeyboard` and its `unlock-system.js` fallback, the desktop handover and keyring refetch; graph: cards, needs, grants | node tests |
| 13 | S3 | `test_ops_access`, playtest, live proof, the reruns of section 10 part 4, docs (N15), the screenshot review | all of it; land S3 |

Step 11 is its own commit so that the changes to existing access checks can be read, reviewed
and, if need be, reverted alone.

**Art task, outside the stages.** Card art for `technique_card.png`: one object sprite, made
at the native size of the other tray items (never resized down), replacing the placeholder
copy of `qr_card.png` that step 9 commits (section 4.3). No stage waits for it and no scenario
changes when it lands. The task is raised with the user when S3 is in review; this plan
generates no images.

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
| `app/policies/break_escape/game_policy.rb`, `test/unit/break_escape/policy_test.rb` | four `?` methods returning `show?`; four names in `DEVICE_ACTIONS` | every ops plan with an action adds a method and a name in the same places |
| `lib/break_escape/ops_log_events.rb` (the log feature's, landed first) | seven entries in `EVENTS`, added stage by stage, one line each; the `KINDS` entries `network`, `host`, `service` and `technique` | every plan that writes rows adds lines to the same two constants |
| `tools/playtest/verify-run.rb` | four names in `ACCESS_KEYS`, four printed lines, two keys on the session line (about 25 lines) | the log feature adds `--ops-log`; S5 and S8 will add their own keys to the same list |
| `public/break_escape/js/systems/test-bridge/access.js`, `docs/test-bridge.md` | the documented shape of `networkView` gains `networks` and `techniques`; no behaviour change | none known |
| `app/models/break_escape/game.rb` | `ACCESS_STATE_DEFAULTS` (four keys); `start_login_session!` (two keywords), `login_session_answer` and `session_for_client` (`access`), the reader `client_access_level`; the server-owned global names; the include of `NetworkOps` | S5a adds `session_access`, points `client_access_level` at it, writes no level, and may add its own keys to the same constant; S8 and S5c change the sign-in order just above |
| `app/models/break_escape/network_access.rb` | the withheld lists (`:18-21`), `network_rows`, blocks, `host_row`, `host_reachable_through?`, `from_route_refusal`, `desktop_request_allowed?`, `desktop_refusal`, `resource_admits_player?` | S5a (what a session may do), the log feature (rows on the existing plant, unplug and join actions). This plan's new code lives in `network_ops.rb` to keep this file's diff small |
| `lib/break_escape/network_model.rb` | new helpers only, appended | S5c may add account kinds to host records |
| `lib/break_escape/credential_model.rb`, `app/models/break_escape/credential_keyring.rb` | `PROOF_KINDS`, one `when` | S7 builds the `hash` kind in the same catalogue; S5b adds a harvest proof |
| `public/break_escape/js/minigames/network-view/network-view-minigame.js` | rows, panels, `hostAction`, `getTestState`; the `perform` path and its pending guard, built in S1 with the unplug guard folded in and widened in S2 and S3 | S6 adds the second renderer, which reads the same answers through `ops-model.js`, never the DOM, and is routed through the same `perform` path; S5a adds no badge here (section 14, request 1) |
| `public/break_escape/js/minigames/network-view/ops-model.js` (new here) | the shared pure module, with `REFUSAL_TEXT` | S6 builds on it and adds its own exports; later plans add their refusal codes to the one table |
| `public/break_escape/js/systems/pc-sessions.js`, `unlock-system.js`, `minigames/container/container-minigame.js` | `access` copied; `heldAtKeyboard` (`pc-sessions.js:480`) and its fallback (`unlock-system.js:266-270`) also false for a copy with `via: "technique"`; one `network_only` handler in `loadLoginDesktop` | S5a reads `access` on the client; S8 changes the sign-in screen |
| `public/break_escape/js/core/game.js`, `public/break_escape/assets/objects/` | one `load.image` line and `technique_card.png` | any plan or art pass that adds an object sprite |
| `app/controllers/break_escape/games_controller.rb` `folder_route_allowed?` | one line | none known |
| `public/break_escape/js/api-client.js` | four functions | every plan with a route |
| `scripts/scenario-schema.json` | section 9.1 | every plan; the file has very long lines, so two edits to one block conflict even when they do not overlap in meaning |
| `scripts/validate_scenario.rb` | one `require_relative` and one `run.call` (`:26`, `:8968`) | every plan adds a line in the same place |
| `scripts/generate_dungeon_graph.rb` | one new block; one `when` in the credential block; legend lines. `scripts/lock_key_diff.rb` is not changed | S5 and S7 add nodes after the same block |
| `tools/playtest/lib/access_leak_scanner.rb` | one collector | S5b, S7, S8 add collectors |
| `test/js/validator-declared-top-level.test.mjs`, the four copy lists of section 11.3 | new names | S6 adds a module to the same copy lists |
| `docs/ACCESS_AND_NETWORKS.md`, `README_scenario_design.md` | N13, N14, N15 in the feature index and a section each | every plan appends rows to the same index table |

New files, owned by this plan alone: `app/models/break_escape/network_ops.rb`,
`scripts/validate_network_ops.rb`, `scripts/real_product_names.txt`,
`public/break_escape/js/minigames/network-view/ops-model.js`, the test files of section 11, the
three scenario folders and the `ops_unchanged` fixtures.

Build order: the log helper stage, then S1, S2 and S3, then the other features in the order the
outline gives. The helper is the one thing this plan needs from another plan before it lands.

## 13. Log rows this feature writes

Rows are written through the log feature's helper, `write_log_row!(event, as:, where:, result:,
detail:, once:, save_limit:)`, which lands before S1 (section 12.1) and whose contract is the log plan's. Each
stage adds its events to `EVENTS` in `lib/break_escape/ops_log_events.rb` and its calls in the
same step as the action, and tests them itself. The helper never saves: every call below sits
in a model method of one of the four routes, on the branch the server has validated, before
that method's own `save!`. A finding id can be longer than a detail value's 40 characters, so
a row carries the finding's alias (`f3`) in its place.

**Kinds.** With its events this plan fills four entries of `KINDS` in the same file, each from
the `NetworkModel` helpers of section 5.1: `network`, `host`, `service` and `technique`. The
`service` lookup shows the id itself, the service's name, and never its `label`: a name is
unique only on its host, a lookup is given the game and an id and not the row's place, and the
row's `where` already names the host. `from` on the two scan rows is a foothold id (a planted
jack device, a joined access point or an implanted PC), which is not a `hosts` entry. It is
registered with the kind `foothold`, which the log plan adds and fills; this plan does not.

The table below is the log plan's own list of these rows (its section 13.7), with the method
and branch added. No row holds a password or any secret, and no row is written from a sync
merge, on a 400 or on the 404.

| Event | Who (`as`) | Where | When (method, branch) | Result | Detail | Bound |
|---|---|---|---|---|---|---|
| `network_swept` | nil | `network`, the one swept | `scan_network!`, when the network is newly added. `POST /network/scan` saves the game | `ok` | `from`: the foothold id (kind `foothold`) | once: the caller writes only on the first sweep |
| `host_scanned` | nil | `host` or `pc`, the one scanned | `scan_host!`, when the host is newly added. `POST /network/scan` saves | `ok` | `from` | once per host |
| `service_checked` | nil | `host` or `pc` | `check_service!`, when the service is newly added to `opsDiscovered.services`, whatever the check found. `POST /network/check` saves | `ok` | `service`: the service name | once per service |
| `finding_confirmed` | nil | `host` or `pc` | `confirm_finding!`, when the status is set. `POST /network/confirm` saves | `ok` | `finding`: the alias; `status`: `confirmed` or `false`; `how`: `quiet` or `probe` | once per finding: a repeat confirm writes nothing |
| `network_alerted` | nil | `network` | `add_noise!`, on the request that sets the alert global. The confirm or technique route that called it saves | `ok` | none | once per network |
| `technique_refused` | nil | `host` or `pc` | `use_technique!`, on each 422 of section 5.4 (never on its 404 or 403). `POST /network/technique` saves after a noisy refusal, which changed `opsNoise`; after a quiet one it saves only when the helper's result is `stored?` (section 5.4) | `refused` | `finding`: the alias; `technique`: the technique id; `reason`: the 422 code, a closed list | merged repeats; a quiet refusal is written with `save_limit: true` (limit 10 in `EVENTS`), so at most ten of them store per place in a five-minute window of server time and the rest are dropped and save nothing until the window ends; a noisy refusal has no limit and keeps the route's save |
| `technique_used` | `{ account: }` (the username the session is as) for a session grant; nil for a credential grant | `host` or `pc` | `use_technique!`, on a grant. `POST /network/technique` saves | `ok` | `finding`, `technique`; `grant`: `session` or `credential`; `access`: `user` or `admin` for a session grant | one per grant: a repeat (`already: true`) writes nothing; a new session after the old one ended is a new grant and a new row |

A step up from user to admin is the `technique_used` row with `access: admin`; no other feature
logs it a second time. `start_login_session!` called with `via: 'technique'` writes no sign-in
row. A repeat of one of a source's 10 newest rows merges into a count on that row up to the log
plan's bound and is dropped after it, so a replayed request never costs a row.

These names are the log's. The client events of section 5.5 share some of the words
(`network_swept`) and are a separate thing: they fire in the browser for objectives and NPC
lines and never reach the log.

## 14. Cross-plan requests

Each is a statement of what this plan provides or needs, for the plan named.

1. **Privilege (S5a).** Section 0 is the contract for the access level: this plan writes it,
   on a technique session only, and sends it; S5a adds the reader `session_access(pc_id)`,
   points `client_access_level` at it (section 5.4), writes no level and adds no badge of its
   own to the network view. The `needs.session` check calls the same reader once it exists.
   A technique session at admin on a headless host that blocks remote sign-in passes
   `desktop_request_allowed?` through its own foothold only (section 5.4), which is the gate
   S5a's collect action is judged by.
2. **Privilege (S5a).** A step up is a weakness with `needs.session: "user"` and
   `grants.session.access: "admin"` on the same host. Using it replaces the record in place and
   keeps `foothold`. `techniques` has one shape, the matcher of section 0; the grant and the
   host sit on the weakness. S5a adds no second shape and no other escalation route.
3. **Privilege (S5a).** A PC holds one session, so a password sign-in replaces a technique
   record and its `access`; a technique record always has its `foothold` (section 0).
4. **Account kinds (S5c) and MFA (S8).** A technique session attempts no sign-in, so lockouts,
   `accepts`, account-kind checks and the second sign-in step do not run for it at run time.
   The validator applies `pc_admits_account?`, with the account-kind rule once that exists, to
   `grants.session.account`. Both plans should say this from their side.
5. **Account kinds (S5c) and MFA (S8).** `host_reachable_through?` and `from_route_refusal` gain
   the discovery condition ahead of every sign-in check. New sign-in checks come after it.
6. **Skin (S6).** The four routes and the `GET /network` fields of sections 5 to 7 are the whole
   surface, and `ops-model.js` with its `REFUSAL_TEXT` is the one shared pure module (section
   5.5). For typing, a finding has an `alias` and a `techniques` entry carries the `itemId` to
   send. This plan builds the scene's `perform` path and its one pending guard in S1 to S3,
   keyed by action and target (for `use`, the card and the finding together), over sweep,
   scan, check, confirm with Probe, use and unplug, with the old unplug guard folded in. The
   skin plan builds no guard: it routes its renderer through the same path and tests the guard
   in both skins. A message an action leaves is drawn by the renderer; Panels shows no
   separate quiet-or-noisy note (section 5.3).
   Playtest beats name actions, so the skin runs the same beats through its own hooks.
7. **Cracking (S7).** `grants` keeps two kinds. A weakness that yields a hash is written
   `grants: { "credential": "<id>" }` with the hash entry's proof naming the finding. S7 widens
   this plan's validator rule from "`saved_connection`" to "`saved_connection` or `hash`" in its
   own build steps, with a test.
8. **Log rows (S9).** The helper stage lands before S1, and this plan registers and writes its
   own rows (section 13) under the log plan's event names. Four points the log plan states
   from its side: `from` on the two scan rows is registered with the kind `foothold`, which
   the log plan adds and fills; the `service` lookup shows the service name as given; its
   row for `technique_refused` says a quiet refusal passes `save_limit: true` (limit 10 in `EVENTS`) and saves only
   when the result is `stored?`, by its own rule for branches that are free today; and its row
   for `service_checked` is bounded once per service (the caller writes it on the first check,
   by `opsDiscovered.services`), not by "a check that adds a finding".
9. **All.** `hosts.<id>` shares one id space with objects and resources. A plan that adds another
   top-level map of things on a network should join it.
10. **All.** `ACCESS_STATE_DEFAULTS` values are copied with a shallow `dup`, so a plan that adds
    a key gives it a flat, empty default.
11. **All.** A route that names a host, a finding or anything else the player must first earn
    answers an unearned id exactly as it answers an invented one (section 6).
12. **The parked defence work (`docs/achitechture/ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`).** The
    noise count and its `alert` global are plain state and a plain global. Nothing here
    assumes a defender, and a later feature can read `opsNoise`.

## 15. Open questions for the user

Five choices are the user's. Each has a recommendation, and the plan is written to it. Every
other design point is settled in the body, with its reason, where it applies.

1. **Is discovery enforced or only a display.** (a) Enforced: on a discovery network a host or
   an open share not yet swept is refused; (b) display only. Recommend (a), so the scan is a real
   step.
2. **Does the loop have a cost?** If confirming a finding and trying a card are both free, the
   player confirms everything on sight and tries every card, decoys teach nothing, and the loop
   is a run of clicks that always succeed.

   | Option | What the player does | Cost to build | Weak point |
   |---|---|---|---|
   | (a) Free | nothing changes | none | the problem above |
   | (b) Evidence required | Confirm is refused until the player holds the finding's evidence (a log, a manual, a remark) | one field, one check | every finding needs a placed item, and a missed item stalls the mission; a wrong card is still free |
   | (c) Noise only | a confirm, and a wrong card, each add to a per-network count; at a limit the scenario reacts | one state key, one network field, one global | with nothing to save a probe, the best play is still "confirm all" until the limit bites |
   | (d) A budget of uses | a host stops answering after N wrong tries | one counter | can lock a player out of a required step; a reset rule is needed |
   | (e) Noise, and evidence makes a confirm quiet | Probe is noisy, Confirm with evidence is silent, a card that reading would have ruled out is noisy; at the limit the server sets a global and the scenario authors the consequence with `fixedIf`, `offWhen`, an NPC line or an objective | (b) and (c) together: one field on a finding, one on a network, one state key, one server-owned global | authors must set a sensible limit; the validator warns when the limit cannot be met or decoys sit on a network with no `alert` |

   Recommend (e). It gives a decoy a price and evidence a value, never blocks the mission by
   itself (the consequence is whatever the author wrote), needs no clock and no defender, and a
   tutorial network can leave `alert` off. It also answers "does a wrong card cost anything":
   one noise when the card's face already ruled it out, nothing when the refusal was an unmet
   need the player could not have matched by reading. If the answer is (a), `evidence`, `alert`
   and `opsNoise` come out of the plan and nothing else moves.
3. **How far does a technique session go round the usual sign-in rules.** Three parts.
   (a) It ignores `remote: "blocked"`, only through its own foothold. Recommend yes: turning off
   remote sign-in does not fix a weak service, and that is worth teaching.
   (b) It ignores account lockouts. Recommend yes: no sign-in is attempted.
   (c) At the PC's own keyboard. Options: serve the desktop there as that account, with no
   password; refuse, and show the sign-in screen; serve it but turn the session into a keyboard
   one that no longer ends on unplug. Recommend refuse: a way in over the network should not make
   the player the account at the physical screen, and it keeps "unplug ends it" simple. The cost
   is one term in the keyboard branch, one line for folders, and a client path that agrees.
4. **The word `technique`.** It was chosen as the neutral word for the card. Social engineering
   scenarios already use it: a pretext line has `technique` (one of six persuasion techniques)
   and an NPC's `tells` has a `techniques` map, in six scenarios, the schema, `pretext-judge.js`
   and the README. What does not collide: the keys. The pretext fields sit inside an NPC's
   pretext block; this plan's sit at the top level, on an item and in a credential proof, where
   nothing reads the word today, so no code or schema path is ambiguous. What does collide: an
   author's search for `"technique"` returns both, the README will have two sections using the
   word, and a validator message that says "technique" alone could mean either.

   | Option | Change | Cost |
   |---|---|---|
   | (a) Keep the word, keep the keys, always say "technique card" | prose, schema descriptions and validator messages say "technique card" and "technique card registry"; the README index entry names the pretext section as unrelated | none in code; the search overlap stays |
   | (b) Keep the word, namespace the keys | top-level `techniqueCards`, item field `techniqueCard`, proof kind `techniqueCard` | a rename across this plan and the four plans that read section 0; searches separate cleanly |
   | (c) Another neutral word for the card | for example `method` or `approach`: `methods`, `method` on the item | the same rename, and it gives up a word already agreed; `method` is vaguer for students |
   | (d) One shared registry for both | pretext techniques and cards in one map | they are different things (a persuasion style against a matcher on class, product and version); the map would hold two shapes |

   Recommend (a) now, with (b) as the fallback if the search overlap proves a nuisance once
   authors use both: the rename is mechanical and can be done before S3 lands, since no scenario
   outside the three test scenarios will hold the keys by then. Not (d).
5. **Does a session gained with a card count as having signed in at that PC, for good?** Every
   session that is not a relay or a token adds its PC to the grow-only `signedInPcs` list, and
   three things read it: "sign in at this PC" tasks, capture proofs of kind `session`, and
   keyring `session` proofs. A technique session would join it with no code change, so a
   mission step that means "get this person's password" could be finished with a card.

   | Option | Effect | Cost |
   |---|---|---|
   | (a) Count it, and warn the author | chains built on "a session at this PC" work however the session was gained; the validator warns wherever a card can stand in for a sign-in that a task or proof names | one validator warning; no engine change |
   | (b) Do not count it | a technique session never completes a sign-in task or a `session` proof; a chain that goes through a card needs its own objective event (`network_technique_used`) and cannot feed a keyring `session` proof | one condition in `start_login_session!`; network work stops feeding the keyring by that path |
   | (c) Count it, and let a task or proof ask for `via: password` | authors choose per step | a new field on three readers, and `signedInPcs` would have to record how each PC was signed in, which it does not today |

   Recommend (a): it keeps network work feeding the rest of the game, changes no existing
   meaning without telling the author, and an author who wants a password-only step can gate
   it on the password item or credential today. (c) is the fallback if authors hit the
   warning often.
