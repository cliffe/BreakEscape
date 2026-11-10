# Access model slice 9.3: networks

Status: **design, written 2026-11-10, not built.** It replaces the sketch in section 9.3 of
`ACCESS_MODEL_PLAN.md` (called "the main plan" below). Sections 3 to 8 of the main plan are built and
are the base this slice stands on. Every claim about existing code was checked against the working
tree on 2026-11-10; method names are the stable reference, line numbers move.

How to read this plan: section 2 says what exists today, section 3 lists the scenario fields,
section 4 the engine behaviour, section 5 every route with its checks in the order they run,
section 6 what reaches the browser, sections 7 and 8 the validator and saved games, section 9 the
build steps with their tests and the feature scenario, section 10 the lab's adoption, sections 11 to
13 the effects on other work, and section 14 the decisions for the user.

## 1. What this slice adds, and why now

The first slice made a captured password or a copied card worth exactly its owner's access, at a PC
or a door the player can walk up to. This slice adds the second gate the main plan names: **what can
be reached at all**. It turns "plant a device on a network, then see and reach what that network
exposes" into one chainable mechanic:

1. **Get a foothold** on a network: plug a rogue device into a network jack, join a Wi-Fi network
   with its key, or (optional, step 9) land an implant on a PC a member of staff plugged a device
   into.
2. **See** what that network exposes: its hosts (sign-in PCs), its file shares and its other
   services, as a list the server composes for that foothold.
3. **Reach** it: sign in to a listed PC from where the player stands with a captured username and
   password, and get that account's desktop, with the shares the account may use mapped on it.
4. **Chain**: what the desktop or the share holds is the next password, code or card, and the next
   network is one link further on.

User feedback after the hands-on test of `lab_physical_pentest` (2026-11-10,
`physical_pentest_followup/USER_FEEDBACK_2026-11-10.md`) asks for exactly this: "If we have
authority to plant a network device in the router, surely it's in scope to connect to see what's
been exposed?" and "accessing the desktops with captured creds should be in scope, to best
illustrate the consequences". The lab's drop box is planted by hand today and leads nowhere
(section 2). The user's design principles apply throughout: chaining is the point; fun and
educational; simple enough for a pixel art game; and the server decides reach, so nothing a network
exposes is sent to the browser before the player has a foothold on it.

## 2. What exists today (verified)

| Area | Today | Where |
|---|---|---|
| Networks | Nothing. No scenario has a top-level `networks`, `networkLinks` or `resources` key, and no object has a `network` field. The `network-architecture` and `network-segmentation-map` minigames belong to the serious games and are unrelated | `scripts/scenario-schema.json`, `scenarios/*/scenario.json.erb` |
| Sign-in | `POST /login` checks "PC reachable" first: the PC's room is unlocked or never locked and nothing above the PC is still locked. Then the lockout, the password and the PC's `access` | `Game#attempt_login!`, `Game#login_pc_reachable?` |
| Sessions | `player_state.sessions[pcId] = { id, via }`, `via` being `password` or `claim`. The desktop is served by `GET /container/:id`, which checks the PC is reachable and a session is held, then composes the PC's `contents` and the admitted `accountProfiles` | `games_controller.rb` `container`, `render_login_desktop`; `Game#login_desktop_contents` |
| Scoped objects | `login_scope_of` finds an object and says whether it sits under a sign-in PC or in a profile; `session_admits?` and `path_unlocked?` gate every route that reaches one | `game.rb` |
| Captures | `se_captures` is written by the client and synced. `GET /capture_secrets` serves an account holder's password only for an earned entry, under `social.captures.revealSecret` | `Game#capture_secrets_for_client` |
| Remote session (lab) | A declared grant: a timer's `give_item` hands the player a `pc` item, "Remote Session: LW-FIN-07", whose two text files are hand-written. The server serves its contents while the item is held. Nothing in it is connected to an account, a PC or a share | `lib/break_escape/declared_grants.rb`, `Game#held_grant_items`, lab `timers[]` `grant_remote_session` |
| Drop box (lab) | `network_port` is a `pc` object with `requiresItem: "kit_dropbox"` and a `confirm_action` that sets the global `kp_netdrop_planted`. The box stays in the inventory (the engine consumes a required item when the confirm opens, so the lab does not use `consumesItem`). A second object, `network_port_planted`, is revealed by the global and shows a status text. A mapping on Ruth adds a "foothold" capture and completes `opt_netdrop`. Its text says "nothing on the network was touched" | `scenarios/lab_physical_pentest/scenario.json.erb`, room `P3` |
| Juice-jack (lab) | `cable_note`, a readable object revealed by `kp_cable_foothold` in the middle of the accounts room | same file, room `open_plan` |
| Bootstrap | `filtered_scenario_for_bootstrap` deep-copies the whole scenario and then deletes what must not ship (room contents, `flags`, `accountProfiles`, capture secrets). **Any new top-level key ships as authored unless this method deletes it** | `game.rb` |
| Globals | Written by the client and merged by `PUT /sync_state` every 30 seconds and on page hide. The server never sets a scenario global itself | `Game#merge_global_variables!`, `state-sync.js` |
| Positions | The server cannot see where the player stands. "Reachable" on the server always means "the room is unlocked or never locked" | main plan 4.2 |
| Inventory | An add is validated and the server stores its own copy of the item. A remove is not checked. Items the server returns in `playerInventory` are restored on load without a request | `games_controller.rb` `inventory`, `inventory.js` `processInitialInventoryItems` |
| A click on an object | Order in `handleObjectInteraction`: a sign-in PC's own branch, then the workstation call, then `triggerOnInteract` with `requiresItem`, then drops, consumables and the generic flow | `interactions.js` |

## 3. Scenario fields

One complete example first; the subsections say what each part means.

```jsonc
{
  "networks": {
    "office_lan": { "name": "Office LAN" },
    "guest_wifi": { "name": "Guest Wi-Fi", "wifi": { "ssid": "Harbour-Guest", "psk": "tide-and-anchor" } },
    "server_net": { "name": "Servers", "downIf": "server_net_down" }
  },
  "networkLinks": [ ["office_lan", "server_net"] ],

  "resources": {
    "scans":   { "kind": "file_share", "name": "Scans", "host": "HB-FS01", "network": "office_lan",
                 "contents": [ { "id": "scan_0412", "type": "text_file", "name": "scan_0412.pdf",
                                 "takeable": true, "text": "..." } ] },
    "ledgers": { "kind": "file_share", "name": "Ledgers", "host": "HB-FS01", "network": "server_net",
                 "access": { "roles": ["finance"] }, "contents": [ /* ... */ ] },
    "printer": { "kind": "printer", "name": "Office printer", "host": "HB-PRN-01",
                 "network": "office_lan", "observations": "A print queue anyone on the LAN can read." }
  },

  "policies": { "hardened": { "remote": "blocked" } },

  "rooms": {
    "comms_room": {
      "network": "office_lan",                       // default for this room's objects
      "objects": [
        { "id": "comms_port", "type": "pc", "sprite": "network_rack1", "name": "Spare wall port",
          "networkJack": true,
          "jackConfirm": "Plug the drop box into this port?",
          "plantedSprite": "pi_cluster1" }
      ]
    },
    "cafe": {
      "objects": [
        { "id": "guest_ap", "type": "pc", "name": "Guest Wi-Fi access point",
          "wifiAp": true, "network": "guest_wifi" }
      ]
    },
    "finance_office": {
      "network": "office_lan",
      "objects": [
        { "id": "lena_pc", "type": "pc", "name": "Lena's PC", "host": "HB-FIN-02",
          "locked": true, "lockType": "login", "access": { "roles": ["finance"] } }
      ]
    },
    "lobby": {
      "objects": [
        { "id": "kit_dropbox", "type": "pc", "sprite": "drop_box1", "name": "Network drop box",
          "takeable": true, "rogueDevice": true }
      ]
    }
  }
}
```

### 3.1 Networks and links

- `networks` is a map of network id to `{ name, downIf?, wifi? }`. `name` is what the player sees
  once they have reach. `downIf` names a global: while it is true the network is down (4.6).
- `networkLinks` is a list of pairs of network ids. A link is undirected. Reach follows links
  through any number of networks that are up (4.2). There are no per-service rules, no direction
  and no firewall objects: a link exists or it does not. That is the whole segmentation model, and
  it is enough to teach it: the guest Wi-Fi in the example reaches nothing on the office LAN because
  no link joins them.
- `networks.<id>.wifi` makes the network a Wi-Fi network: `ssid` (required, shown on the access
  point) and `psk` (the key; leave it out for an open network). **The key lives here and nowhere
  else**, as an account's password lives only in `creds` (main plan, section 3). `networks` is never
  sent to the browser (section 6), so the key is withheld without any stripping in room data.

### 3.2 Membership

- A room object may carry `network`. A room may carry `network` as the default for its objects; an
  object's own value wins. An object with neither is on no network.
- In this slice membership matters for sign-in PCs (which become hosts), jacks and access points.
  Slice 9.2 also reads a plain workstation's network for NPC work (section 12).
- `host` on a sign-in PC is its label on the network ("HB-FIN-02"). Without it the PC's `name` is
  used. It is not secret: capture entries already print host names.

### 3.3 Footholds

A foothold is the player's presence on one network. There are three ways to get one.

**A rogue device in a network jack.**

- A jack is any room object with `"networkJack": true` and a network (its own or its room's). The
  sketch's `network_jack` object type becomes a field, so a wall port, a patch panel or the back of
  a router can each be a jack with its own sprite.
- A rogue device is a takeable item with `"rogueDevice": true` (the sketch's `rogue_device` tag;
  items have no tag list, only the single `needsTag` the needs system uses).
- Optional jack fields: `jackConfirm` (the confirm text; default "Plug <device name> into
  <jack name>?"), `plantedSprite` (the jack's texture while a device is in it), `linkName` (the name
  of the link item, 4.1), `requiresItemHint` and `requiresItemHintVariants` (the refusal when no
  rogue device is held, read through the existing `requiresItemHint` resolver), and
  `"portSecurity": true` with an optional `portSecurityMessage`.
- `portSecurity` is the control working: the device goes in, the switch refuses an unknown device,
  no foothold is given and the device stays in the inventory. It costs one check and lets a scenario
  show the fix the lab's text already names (disable unused ports, port security). It is never a
  puzzle gate with a hidden bypass in this slice.
- A jack takes no `triggerOnInteract`, no lock and no `lockType`: its click is the plant flow
  (4.1). The validator errors on the combination, as it does for a sign-in PC.

**Wi-Fi with a key.**

- An access point is any room object with `"wifiAp": true` on a network that has a `wifi` block.
  Several access points may serve one network.
- Clicking it shows the network name and asks for the key (nothing is asked for an open network).
  The key is typed and checked on the server. Learning it is the puzzle: a poster, a sticky note, a
  social media post, a pretext call. A Wi-Fi key is a lock secret like a door PIN, not an account
  password, so ink may say it and the validator's password-in-ink error does not cover it.
- No device is needed (the player's own phone is implied) and there is no range: once joined, the
  foothold holds wherever the player is. The server could not check range anyway.

**An implant on a PC (optional, step 9).**

- A scenario action, `{ "type": "grant_foothold", "pc": "<pc id>", "as": "owner", "name": "..." }`,
  on any path the engine runs actions from (the same paths as a declared grant: `timers[].actions`,
  `triggerOnInteract`, `onInteract.actions`, a `confirm_action`'s `onConfirm`, and the ESD
  minigame's lists). It is how "Sofia plugged the BadUSB in" becomes a foothold.
- It gives a foothold on that PC's network. With `"as": "owner"` on a sign-in PC whose owner has an
  account, it also lets the player open the owner's session on that PC with no password (4.4).
- Like a declared grant, its trigger is a client-set global, so the server can only check that the
  scenario declares it (4.8).

### 3.4 What a network exposes

Two kinds of thing, and only these, appear in a foothold's view.

**Sign-in PCs.** Every `lockType: "login"` object on a reached network is listed as a host, whatever
room it is in and whether or not the player has ever opened that room. Remote sign-in is allowed
unless the PC's policy says `"remote": "blocked"` (a new policy field beside `usb` and `social`;
default `allowed`). A blocked PC is still listed, marked "remote sign-in off": the player sees the
control.

**Resources.** `resources` is the registry the main plan sketches in 9.2. This slice defines the
fields it reads and adds `contents`:

| Field | Meaning |
|---|---|
| `kind` | `file_share`, or any other string (`printer`, `email`, `service`): a label and an icon |
| `name`, `host` | What the player sees: "Ledgers on HB-FS01" |
| `network` | Required for the resource to be visible to a foothold. A resource tied only to a physical `object` (9.2) and with no network is never listed |
| `access` | `{ roles, people }`, as on any ACL. None: open to anyone on the network |
| `downIf` | A global; while true the resource does not respond (4.6) |
| `contents` | `file_share` only: items, as in an account profile. Ids are global |
| `observations` | For a resource with no contents: the text shown when the player clicks its row |
| `object` | 9.2's link to a physical object. Not read by this slice |

A file share is the network counterpart of an account profile: contents gated by an access list
rather than a lock. How the player opens one is in 4.5.

### 3.5 Tasks, events and globals

- An `unlock_object` task whose target is a jack or an access point is met when a foothold has ever
  been gained from it (the rule a sign-in PC already has with `signedInPcs`). An `unlock_object`
  task on a sign-in PC is met by a remote sign-in exactly as by a local one.
- Events, each emitted under its bare name and as `<name>:<id>` (the id in brackets):

| Event | Data | When |
|---|---|---|
| `network_foothold_gained` (source id) | `{ footholdId, via, networkId, sourceId, first }` | Any foothold: `via` is `jack`, `wifi` or `implant`; `sourceId` is the jack, access point or PC |
| `network_device_planted` (jack id) | `{ jackId, footholdId, networkId, deviceId }` | A plant succeeded |
| `network_device_refused` (jack id) | `{ jackId, reason }` | `reason`: `port_security` or `no_device` |
| `network_device_unplugged` (jack id) | `{ jackId, footholdId, endedPcIds }` | The player took the device back |
| `network_joined` (access point id) | `{ apId, footholdId, networkId }` | A Wi-Fi join succeeded |
| `network_join_failed` (access point id) | `{ apId }` | A wrong key |
| `network_viewed` (network id, once per listed network) | `{ footholdId, networkId, hostIds, hostList, first }` | The view opened or refreshed and listed that network's hosts; `hostList` is the ids comma-joined for mapping conditions; `first` is true the first time this page session |
| `network_host_opened` (host id) | `{ footholdId, hostId, kind }` | The player clicked a host row |
| `network_share_opened` (resource id) | `{ resourceId, via, pcId }` | A share's contents loaded; `via` is `foothold` (an open share from the view) or `session` (a mapped share on a desktop) |
| `network_unreachable` (network id) | `{ footholdId, networkId, pcId }` | A view or a remote desktop found its route down |
| `pc_signed_in` and `pc_signed_out` | gain `remote` (true for a remote session) and `footholdId` | As in the main plan 5.3 |

- Globals the client publishes, as the workstation layer publishes `<id>_screen_locked`:
  `<jackId>_planted` and `<apId>_joined`, for `observationVariants`, hint variants and
  `revealOnGlobal`. A scenario that reads one declares it in `globalVariables`, as scenarios do for
  the workstation globals. They are display state only; the server never reads them.

## 4. Engine behaviour

### 4.1 Footholds and the link item

**State.** Two new `player_state` keys, with empty defaults in `initialize_player_state` and off the
reset's `preserved_keys`, like the first slice's keys:

| Key | Shape | Meaning |
|---|---|---|
| `footholds` | `{ footholdId: { via, network, source, device?, as?, seq } }` | The footholds held now. `footholdId` is `jack_<jackId>`, `wifi_<networkId>` or `implant_<pcId>`. `device` is the server's copy of the planted item, so an unplug can give it back. `seq` orders them |
| `gainedFootholds` | list of source ids | Every jack, access point or PC a foothold was ever gained from (for tasks) |

A session opened over the network also records it: `sessions[pcId] = { id, via, foothold }`, with
`via` still `password` (or `implant`) and `foothold` the foothold it came through.

**The link item.** A foothold is something the player holds, so the server puts a handle for it in
the inventory in the same request that creates the foothold, and answers with the inventory:

```jsonc
{ "id": "netlink_jack_comms_port", "type": "network_link", "footholdId": "jack_comms_port",
  "name": "Drop box: Spare wall port", "sprite": "drop_box1", "takeable": false,
  "observations": "Your drop box, calling home from the comms room. Open it to see what it reaches." }
```

- `name` is the source's `linkName`, else "<device name>: <jack name>", "Wi-Fi: <ssid>" or "Remote
  session: <host or PC name>". `sprite` is the planted device's sprite for a jack; for Wi-Fi and
  implants it is the source's `linkSprite`, else the phone's image until link art exists
  (section 14, decision 7).
- The client shows it from the route's answer without a second request, the way a reload restores
  `playerInventory`. Clicking it opens the network view (4.3). It cannot be dropped.
- The foothold, not the item, is what the server checks. A client that removes the item loses only
  its handle; `network-links.js` re-shows a missing handle from the `footholds` list on load.
- The user wants captured credentials, notes and remote sessions kept together in a container in
  the inventory. Link items are built to be filed there (section 12); until that container exists
  they sit in the inventory bar, as the lab's Remote Session item does today.

**Planting.** A click on a jack runs in `network-links.js`, from a branch in
`handleObjectInteraction` placed after the sign-in PC branch:

1. A device is planted here: a two-choice prompt, **Open** (the network view for this foothold) or
   **Unplug** (take the device back).
2. No rogue device is held: the jack's resolved `requiresItemHint`, as an item plant refuses today.
3. Otherwise `window.gameConfirm` with `jackConfirm`. The device is taken only after the player
   confirms and the server accepts, which removes the reason the lab could not use `consumesItem`.
4. On success: the device leaves the inventory, the link item arrives, the jack shows
   `plantedSprite`, `<jackId>_planted` is published and the events fire. A `port_security` refusal
   shows the jack's message and changes nothing.

**Unplugging** returns the device, removes the link item and the foothold, and ends every session
opened through that foothold (their desktops close with "The link dropped"). A scenario with one
drop box and two jacks therefore cannot be soft-locked by planting in the wrong one.

**Joining Wi-Fi.** A click on an access point that is not yet joined opens the password minigame in
a new key mode (title "Join <ssid>", one field, the server's answer as the message, no attempt limit
of its own); an open network joins at once. A joined access point opens the network view.

### 4.2 Reach

One rule, in one shared module (`lib/break_escape/network_model.rb`, plain Ruby so the server, the
validator and the dungeon graph agree, as `access_identities.rb` does for identities):

- A network is **up** unless its `downIf` global is true. The server reads the global from
  `player_state.globalVariables`, falling back to the scenario's `globalVariables` default.
- `reach_from(network)` is empty when that network is down; otherwise it is that network plus every
  network joined to it through `networkLinks`, walking only through networks that are up.
- A foothold **reaches** a network when the network is in `reach_from(foothold.network)`. A PC
  reaches a resource when the resource's network is in `reach_from(the PC's network)` and the
  resource's own `downIf` is not true.
- Rights still come from access lists. Reach is the second gate, never a replacement for the first.

### 4.3 The network view

Clicking a link item opens a new minigame, `network-view`, in the desktop window chrome the
container minigame uses. It shows what `GET /network` answers for that foothold and nothing else:

- a header: the link's name and its own network ("Drop box: Spare wall port, on Office LAN");
- one block per reached network, the foothold's own first, each a list of host rows. A linked
  network that is down is shown as one greyed line, "Servers: no route", with no rows. That line is
  the cue for an outage puzzle, and it tells the player nothing they could not see on a real
  routing table;
- a sign-in PC row: host label, name, and **Sign in** (or "remote sign-in off"). A PC with a
  session through this foothold shows the account and **Open**;
- a share row: name and host, and either **Open** (an open share) or a padlock with "Needs an
  account with access" (a share with an access list; 4.5 says how it opens);
- any other resource: name, kind icon, and its `observations` on click.

The view never shows account names, access lists, policies or contents. It refetches when the
player reopens it and when a global changes while it is open (the client cannot tell which globals
are `downIf` globals, so it refetches on any, debounced). Before every `/network` request, plant
and remote sign-in the client awaits `window.stateSync.sync()`, so the server's copy of the globals
is current and an outage the player has just caused or repaired is seen at once.

### 4.4 Remote sign-in and the remote desktop

**Sign-in.** **Sign in** on a PC row opens the first slice's sign-in screen with two differences:
there are no account tiles (the username is typed, as on a `loginPicker: false` PC, whatever the PC's
own picker says: tiles are something you see by standing at the screen), and the request carries the
foothold. A small **Captured sign-ins** list under the fields fills them from the player's capture
entries: the username from the entry and the password from the `/capture_secrets` map the captures
view already fetches. It reads only what the player can already read, and it is the link the user
asked for between "captured credentials" and "use them".

**The server's answer** is the first slice's, with "PC reachable" replaced by "PC reachable over the
network" (section 5). The lockout counter is the same one a local attempt uses, so guessing remotely
and guessing at the keyboard share a budget. A right password for an account the PC's `access` does
not admit still answers "This account can't sign in on this PC".

**The desktop** is the same desktop: the PC's own `contents`, the admitted profiles, and the mapped
shares (4.5), served by `GET /container/:id`. Its header adds a line, "Remote session through
<link name>". Everything a local session allows (Open, Copy, Move, locked folders, Switch user,
Sign out) works the same way.

**One session per PC, as before.** A remote sign-in fills the same `sessions[pcId]` slot a local one
would, so walking up to that PC afterwards opens the same desktop. The owner sitting at the desk
does not block a remote session (the "is using this PC" rule is about the physical screen, and the
server cannot see it); it still blocks a click on the PC itself.

**When a session is usable.** One helper, `session_usable?(pc_id)`, replaces the bare "PC
reachable" test wherever a session is used (`container`, the inventory add, the scope checks):

- the PC is physically reachable (today's rule), or
- the session has a `foothold`, that foothold is still held, it reaches the PC's network, and the
  PC's policy allows remote sign-in.

A remote session whose route is down is kept but answers 403 with `reason: "unreachable"`; the
client keeps its copy and shows "No route to <host>". When the route returns, the desktop opens
again with no password. A 403 with `reason: "no_session"` (or with no reason, as today) still makes
`pc-sessions.js` drop its copy.

**Implant sessions (step 9).** A foothold from `grant_foothold` with `"as": "owner"` shows that PC's
row with **Open session as <owner's display name>**. It is `POST /login` with `claim: "implant"`:
a session as the owner with `via: "implant"`, no password, kept across reloads, ended only by Sign
out or by switching account. It does not need the owner to be away and the screen's lock state does
not matter: the implant runs inside the owner's own session.

**Reload.** Password and implant sessions, remote or not, survive a reload as password sessions do
today. Footholds and `gainedFootholds` are in the scenario response (section 6).

### 4.5 Shares

- **An open share** (no `access`) opens straight from the network view for any foothold that
  reaches it: the lesson is the unauthenticated share.
- **A share with an access list** opens from a desktop. When a desktop is composed for a session,
  local or remote, every `file_share` whose `access` admits the session's identity (or that has no
  `access`) and that the PC reaches (4.2) is added after the profiles as a folder, "Ledgers
  (\\HB-FS01\Ledgers)". Opening the folder fetches the share's contents from
  `GET /container/<resourceId>`. A PC with no network maps no shares.
- So one sign-in mechanic serves everything: accounts open desktops, desktops carry the shares the
  account may use, and the network decides which of them are there. A PC in an unlocked room and a
  PC reached through a drop box behave the same once signed in.
- Files in a share are taken with the first slice's Open, Copy and Move dialog and its `transfer`
  field. Locked folders inside a share work as they do inside a profile.
- A share is found by `login_scope_of`, which now walks `resources` and reports the scope
  `{ type: 'resource', id }`. `session_admits?` gains that case: it asks
  `resource_admits_player?(resource)`, true when the resource and its network are up and either the
  share is open and some held foothold reaches it, or some usable session's identity is admitted
  and that session's PC reaches it.

### 4.6 Outages

- A network or a resource with `downIf` is down while that global is true. Scenarios set the global
  with the actions they already have (`set_global` from an object's `triggerOnInteract`, an ink tag,
  a timer): pull the uplink, trip the breaker, restore the link.
- For the player an outage removes reach: the network's hosts leave the view, remote sessions
  through it answer "No route", mapped shares on it leave every desktop. A network authored down
  until the player repairs something is a chain step in the other direction: a physical action
  opens a network.
- What an outage does to NPCs (work fails, frustration rises, people leave their desks) belongs to
  slice 9.2 (section 12).
- The global is client-written, so an outage is display and pacing, not protection: a modified
  client can raise or clear it. Anything that must not be read early sits behind an access list or
  a password as well. The validator says so (section 7).

### 4.7 Determinism

Nothing in this slice rolls. Reach is a pure function of the scenario, the footholds held and the
`downIf` globals.

### 4.8 What the server establishes

| Fact | Established by | Strength |
|---|---|---|
| A Wi-Fi join | The key, typed and compared on the server | Strong: the browser never holds the key |
| A plant | The server inventory holds an item whose scenario definition is a rogue device, and the jack's room is unlocked or never locked | As strong as a keycard pickup (main plan 4.2). The server cannot see that the player walked to the jack |
| A remote sign-in | Password, lockout and `access` checked on the server, plus reach from a held foothold | As strong as a local sign-in |
| An implant | The scenario declares a `grant_foothold` for that PC | Client-claimed, exactly like a declared grant: a modified client can claim it at any time |
| An outage | A client-written global | None. See 4.6 |

A puzzle that must not be skipped therefore ends in a password or key the server checks, which is
what a chain through a remote sign-in already is.

## 5. Server routes

Every route this slice adds or changes, with its checks in the order they run. A failed check stops
the request. "Locked" means the route joins the `with_game_lock` list. Status codes follow the
first slice's (404 for an unknown target, 403 for one that cannot be reached, 422 for a refusal the
player caused).

**Shared checks.**

- *Object reachable*: the object is a room object, its room is unlocked or never locked, and every
  locked container above it is unlocked (`login_pc_reachable?`, generalised to any room object as
  `object_reachable?`).
- *PC reachable over the network*, for a foothold id: the foothold is in `footholds`; the PC is a
  sign-in PC with a network; the foothold reaches that network (4.2).
- *Rogue device held*: a scenario item definition with `rogueDevice: true` that
  `ItemIdentity.held_in?` finds in the server inventory, read from the definition and never from a
  field the client wrote (the rule for a held keycard).

| Route | Parameters | Checks, in order | Writes and answer |
|---|---|---|---|
| `POST /network/plant` (new, locked) | `jack_id`, optional `device_id` | 1. The jack exists: a room object with `networkJack: true` and a network. 2. Object reachable. 3. No foothold `jack_<id>` yet; if there is one, answer it again with `already: true` and write nothing. 4. Rogue device held (the one named by `device_id`, else the first). 5. The jack does not set `portSecurity` | Check 4 fails: 422, `reason: "no_device"`. Check 5 fails: 422, `reason: "port_security"` and the jack's message; nothing written. Success: the device leaves the inventory; `footholds[jack_<id>]` is written with the device's copy; the jack id joins `gainedFootholds`; the link item joins the inventory. Answer `{ success, foothold, inventory }`, `foothold` in the client shape of section 6 |
| `POST /network/unplug` (new, locked) | `jack_id` | 1. Foothold `jack_<id>` exists. 2. Object reachable (the jack) | The foothold and the link item go; the device returns to the inventory; every session whose `foothold` is this one is deleted. Answer `{ success, inventory, endedPcIds }` |
| `POST /network/join` (new, locked) | `ap_id`, `psk` | 1. The access point exists: a room object with `wifiAp: true` whose network has a `wifi` block. 2. Object reachable. 3. Already joined: answer the foothold again, `already: true`. 4. The network has no `psk`, or `psk` (surrounding spaces trimmed) equals it exactly | Check 4 fails: 422 "Incorrect key". Failures are not counted and nothing locks out: a Wi-Fi key has no attempt limit. Success: `footholds[wifi_<networkId>]`, the access point id joins `gainedFootholds`, the link item. Answer as a plant |
| `POST /network/implant` (new, locked; step 9) | `pc_id` | 1. The scenario declares a `grant_foothold` action for this PC on a path the engine runs (`NetworkModel.declared_implants`, using `DeclaredGrants.executed?`). 2. The PC is a room object with a network | `footholds[implant_<pcId>]` with `as` set to the owner's id when the action says `"as": "owner"`, the PC is a sign-in PC, its owner has an account and its `access` admits the owner; the link item. Answer as a plant. No reachability check: a member of staff plugged the device in |
| `GET /network` (new) | optional `foothold` | None beyond the game's own authorisation. An unknown foothold id answers 404 | `{ footholds: [...] }`: every held foothold (or the one named) with the view of section 6. A game with no footholds answers an empty list: nothing about any network |
| `POST /login` (changed, locked) | as today, plus optional `foothold` | Without `foothold`: as today. With it: 1. PC reachable over the network through that foothold; otherwise 403 "PC not reachable". 2. The PC's policy does not set `remote: "blocked"`; otherwise 422 "Remote sign-in is turned off on this PC", `remoteBlocked: true`, whatever was typed, and no failure counted. 3 to 5. The first slice's checks 2 to 4 unchanged (lockout, username and password, `access`), on the same `pcId|username` counters | Success: `sessions[pcId] = { id, via: "password", foothold }`, `signedInPcs`; the answer adds `remote: true` and `footholdId`. Refusals as today |
| `POST /login` with `claim: "implant"` (new, locked; step 9) | `pc_id`, `foothold` | 1. The foothold is `implant_<pcId>`, is held and has `as`. 2. The PC is a sign-in PC, the `as` NPC has an account and the PC's `access` admits it. 3. No session is held at the PC already (a claim never replaces a session) | `sessions[pcId] = { id, via: "implant", foothold }`, `signedInPcs`. Answer as a claim, with `via: "implant"`, `remote: true`. Failure: "Sign in required" |
| `POST /login` with `claim: "owner"` | as today | As today. With a `foothold` parameter it is refused: an unlocked screen is a physical thing | As today |
| `GET /container/:id` (changed, locked) | as today | A sign-in PC: 1. A session is held (403 `reason: "no_session"`). 2. `session_usable?` (403 `reason: "unreachable"`). A resource, or an object inside one: 1. `resource_admits_player?` (403, same two reasons: `unreachable` when it or its route is down, `no_session` when nothing the player holds is admitted). 2. `path_unlocked?` for the folders above it and itself. Anything else: as today | A sign-in PC: its `contents`, the admitted profiles, then a folder stub for each mapped share (4.5): `{ id: <resourceId>, type: "network_share", name, takeable: false, locked: false, hasContents: true }`. A resource: its `contents` through `filter_container_contents` |
| `POST /inventory` add (changed, locked) | as today, plus `source_resource_id` | With `source_pc_id`: as today, with `session_usable?` added to check 1, and the search also covers the shares mapped for that PC's session. With `source_resource_id` (an open share opened from the view): 1. `resource_admits_player?`. 2. The item is in that resource's contents. 3. `path_unlocked?`. 4. Takeable. 5. Its `transfer` allows the choice. With neither: as today, and the generic search skips `resources` as it skips profiles | As today; a Copy records `copiedItems` |
| `POST /unlock` (changed, locked) | as today | Check 1 (the scope refusal) covers the `resource` scope through `session_admits?` | As today |
| `POST /complete_task` (changed, locked) | as today | An `unlock_object` task whose target is a jack or an access point: its id is in `gainedFootholds` | As today |
| `GET /scenario` (changed) | as today | As today | `filtered_scenario_for_bootstrap` deletes `networks`, `networkLinks` and `resources`. The action adds `footholds` (client shape, no hosts) and `gainedFootholds`; each `sessions` entry gains `remote` and `footholdId` |
| `GET /room/:id`, and the room data a door unlock returns (changed) | as today | As today | Section 6 |

`POST /logout`, `GET /login_accounts` and `GET /capture_secrets` are unchanged. `/login_accounts`
keeps its physical "PC reachable" check, so tiles are never served over the network.

## 6. What reaches the browser, and what never does

The rule: **the browser learns a network's name when the player gets a foothold on it, and learns
what the network exposes only from `GET /network` for a foothold that reaches it.** The withholding
lives in the code that ships the data.

| Path | Sent | Withheld |
|---|---|---|
| Bootstrap, `GET /scenario` | `policies` (with `remote`), as today. `footholds`: `[{ id, via, name, itemId, sourceId, network: { id, name } }]` for footholds held. `gainedFootholds` | `networks`, `networkLinks` and `resources` are deleted, so no network name, link, Wi-Fi key, resource, share content or `downIf` wiring ships |
| Room data (`filtered_room_data`) | On a jack: `networkJack`, `jackConfirm`, `plantedSprite`, the hint fields, and `jackPlanted` (true when the server holds a foothold there). On an access point: `wifiAp` and a composed `wifi: { ssid, secured, joined }`. On a sign-in PC: `host` | `network` on every object and on the room; `portSecurity` and `portSecurityMessage` (the player finds out by trying); `linkName` and `linkSprite` (they arrive on the link item) |
| `POST /network/plant`, `/join`, `/implant` | The foothold in the bootstrap's shape, and the inventory with the link item | Hosts. The view is a separate request |
| `GET /network` | Per foothold: `{ id, via, name, network: { id, name, up }, networks: [{ id, name, up, via, hosts: [...] }] }`. A PC host: `{ id, kind: "pc", name, host, remoteSignIn, session }`, `session` being `{ username, displayName, via }` only for a session through this foothold. A resource: `{ id, kind, name, host, open, up, observations? }` (`observations` only for a resource with no contents). A linked network that is down: its id and name, `up: false`, no hosts | Networks the foothold does not reach, entirely. Account names and tiles, `access` lists, policies' other fields, share contents, the names of `downIf` globals, Wi-Fi keys |
| `GET /container/:id` | A desktop, with share stubs for mapped shares; a share's contents when `resource_admits_player?` holds | Everything else, with a 403 |
| Events and globals | `<jackId>_planted`, `<apId>_joined`; event data as in 3.5 | Nothing server-side is read from them |

The names of rooms, objects and NPCs a host row shows ("Lena's PC") are the names room data would
show a player who walked in. They can name a room the player has not opened; that is the point of
looking at a network.

**No-exposure test.** A server test, beside the first slice's no-password test and run after every
step that changes what the server sends: for a fixture with two networks, a link, a Wi-Fi key, an
open share, a protected share, a sign-in PC in a locked room and a planted-device route, no response
from `/scenario`, `/room/:id`, a door `/unlock`, `/login_accounts`, `/capture_secrets` or
`/network` contains a network name, a resource's name or host label, a share item's name or text,
or the Wi-Fi key **before any foothold**; after a foothold on the first network, `/network` holds that
network's names and no string from the unreached one; the Wi-Fi key is in no response at any point;
and a share's item text is only ever in a `/container` answer.

<!-- PART3 -->
