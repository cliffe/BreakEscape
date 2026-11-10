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
  once they have reach. `downIf` names a global: while it is truthy the network is down (4.6).
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

- A network is **up** unless its `downIf` global is truthy. The server reads the global from
  `player_state.globalVariables`, falling back to the scenario's `globalVariables` default.
- `reach_from(network)` is empty when that network is down; otherwise it is that network plus every
  network joined to it through `networkLinks`, walking only through networks that are up.
- A foothold **reaches** a network when the network is in `reach_from(foothold.network)`. A PC
  reaches a resource when the resource's network is in `reach_from(the PC's network)` and the
  resource's own `downIf` is not truthy.
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

- A network or a resource with `downIf` is down while that global is truthy. Scenarios set the global
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
| `POST /login` (changed, locked) | as today, plus optional `foothold` | Without `foothold`: as today. With it: 1. PC reachable over the network through that foothold; otherwise 403 "PC not reachable". 2. The PC's policy does not set `remote: "blocked"`; otherwise 422 "Remote sign-in is turned off on this PC", `remoteBlocked: true`, whatever was typed, and no failure counted. 3 to 5. The first slice's checks 2 to 4 unchanged (lockout, username and password, `access`), on the same per-PC, per-username counters | Success: `sessions[pcId] = { id, via: "password", foothold }`, `signedInPcs`; the answer adds `remote: true` and `footholdId`. Refusals as today |
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

## 7. Validator, schema and dungeon graph

### 7.1 Schema (`scripts/scenario-schema.json`)

- Top level: `networks` (map of `{ name, downIf, wifi: { ssid, psk } }`), `networkLinks` (list of
  two-item lists of strings), `resources` (map; the fields of 3.4, with `additionalProperties`
  left open so slice 9.2 can add its own).
- Rooms: `network`.
- Objects: `network`, `host`, `networkJack`, `jackConfirm`, `plantedSprite`, `portSecurity`,
  `portSecurityMessage`, `wifiAp`, `linkName`, `linkSprite`, `rogueDevice`.
- Policies: `remote`, enum `allowed`, `blocked`.
- Actions: `grant_foothold` with `pc`, `as` (enum `owner`) and `name` (step 9).

### 7.2 Validator (`scripts/validate_scenario.rb`)

The new top-level keys join `known_top_level` in `check_unknown_fields`, and the new fields join the
room, object and policy lists. The checks go in a new function, `check_network_model`, called
beside `check_access_model`, and read their rules from `BreakEscape::NetworkModel` so they match the
server.

Errors:

- a `network` (on a room, an object or a resource), a `networkLinks` entry or a `grant_foothold`
  `pc` that names nothing; a link from a network to itself; a link that is not a pair;
- a jack or an access point with no network of its own or from its room; an access point whose
  network has no `wifi` block; a `wifi` block with no `ssid`;
- `networkJack` or `wifiAp` on a sign-in PC, on an object with `triggerOnInteract`, `locked` or a
  `lockType`, on an object inside a container or a profile, or both on one object;
- a `downIf` global that `globalVariables` does not declare;
- `contents` on a resource whose `kind` is not `file_share`; a resource id, or the id of an item in
  a resource's contents, shared with a room object, a profile item or another resource (ids are
  global, and `GET /container/:id` resolves by id);
- a resource `access` naming a person that is no NPC (the existing ACL reference check, with
  `resources/<id>/access` added to its sources);
- a policy `remote` that is neither `allowed` nor `blocked`;
- an account password (`creds.password`) or a Wi-Fi key in a network's `name` or in a resource's
  `name`, `host` or `observations`: those strings go to every foothold's view. A clue belongs in
  the text of an item, where it is a deliberate clue like any note;
- `grant_foothold` on a path the engine never runs (the rule `DeclaredGrants.unexecuted` applies to
  `give_item`), or with `"as": "owner"` on a PC that is not a sign-in PC with an owner who has an
  account its `access` admits (step 9).

Warnings:

- a jack in a scenario with no `rogueDevice` item, and a `rogueDevice` item in a scenario with no
  jack;
- a Wi-Fi key that appears nowhere in the scenario's authored text or compiled ink: the player has
  no way to learn it;
- a `file_share` with an access list that no sign-in PC reaches (no desktop can ever map it), or
  that no account is admitted to;
- a `file_share` with an access list whose admitted accounts can sign in at no PC that reaches it;
- two networks with the same `ssid`; two sign-in PCs with the same `host`;
- an open share with contents on a network that starts down (its `downIf` global defaults to
  true): the outage is a client-set global, so treat the share as readable by a modified client
  (4.6).

Information lines, printed with the identity reach the first slice prints:

- **Network reach.** For each foothold source (jack, access point, implant), the networks it
  reaches with everything up, and on each the sign-in PCs and resources listed.
- **Doors skipped.** Each sign-in PC that sits in a locked room and can be signed in to remotely
  from a foothold source outside that room, with the accounts admitted. This is the first slice's
  "identities that skip locks are flagged" applied to networks: the author confirms the remote route
  is intended, or sets `remote: "blocked"` on the PC's policy.
- A network with hosts or resources that no foothold source reaches (it may exist only for 9.2's
  NPC work).

Tests: `test/js/validator-network-model.test.mjs` (new, in the pattern of
`validator-access-model.test.mjs`): one fixture per error and warning, a clean fixture that raises
none, and a fixture whose information lines are compared.

### 7.3 Dungeon graph (`scripts/generate_dungeon_graph.rb`)

- A foothold source is a key-like node ("Drop box at Spare wall port", "Wi-Fi key: Harbour-Guest")
  with an edge to its network's node; the rogue device item and the Wi-Fi key's clue point at it
  the way a key points at a lock.
- A network is a node. Links are edges between network nodes, labelled with a `downIf` global when
  either end has one.
- A network node has an "exposes" edge to each sign-in PC and each resource on it. The first
  slice's account nodes already point at the PCs they sign in to; a share with an access list gets
  an edge from each admitted account's sign-in node.

Tests: `test/js/dungeon-graph-networks.test.mjs` (new, beside
`dungeon-graph-identities.test.mjs`): a jack reaches its network and, over a link, a second one; a
down-by-default network's edge carries its global; a protected share has an edge from each admitted
account and none from the network alone.

## 8. Saved games and reset

- **Games created before this slice.** Their `scenario_data` snapshot has no `networks`, so every
  new route answers 404 or an empty list and nothing else changes. Their `player_state` has no
  `footholds` key: every reader defaults it, as `access_sessions` does for `sessions`.
  `initialize_player_state` only fills a key that is missing, so it is safe to run on them.
- **A scenario that adopts networks later** (the lab, section 10) changes only games created after
  the edit: a game in progress keeps its snapshot, old drop box included.
- **Reload.** `footholds`, `gainedFootholds` and every password or implant session are kept. The
  link items are ordinary inventory entries and come back in `playerInventory`. `jackPlanted` and
  `wifi.joined` in room data restore the jack's look and the `<id>_planted` and `<id>_joined`
  globals, which `network-links.js` republishes on load (the globals themselves are also in the
  save; the server's answer wins).
- **Reset.** Neither new key is preserved, and the inventory is rebuilt from the start items, so a
  reset returns every device to where the scenario put it.
- **A session's `foothold`** is an extra key on an existing record. Code that reads `id` and `via`
  is unaffected, and `end_claimed_sessions!` still ends only `via: "claim"`.

## 9. Build steps

Build in this order. Each step is testable before the next and its tests are part of the step. The
testing approach is the first slice's (main plan, section 8, "How the slice is tested"): unit tests
in every step; one feature scenario built for testing, `test_access_networks`; scripted regression
runs of it through the `window.__test` bridge with the two checks after every beat (what reached the
browser, what the server recorded); the three first-slice suite runs again wherever a step touches
sign-in; `lab_physical_pentest` last. Model tiers for the runs are the ones `AGENTS.md` assigns to
scripted regression runs and to persona runs. All browser runs use the keyless server on :3001;
nothing in this plan touches the server on :3000. No step runs a database task.

A step is done when its unit tests, the node suite (`bin/test-js`), the Rails suite
(`bin/rails test`), the no-password test, the no-exposure test and every suite run built so far
pass.

### Step 1. Shared rules and loader

Files:
- `lib/break_escape/network_model.rb` (new): `networks(data)`, `network_of(object, room)`,
  `up?(network, globals)`, `reach_from(network_id, data, globals)`, `sign_in_pcs_on(network_id)`,
  `resources_on(network_id)`, `foothold_sources(data)`, `reach_conditions(station_network,
  resource, data)` (the routes between a PC's network and a resource, each as the list of `downIf`
  globals along it; used by the validator here and by slice 9.2, section 12.3) and (step 9)
  `declared_implants(data)`.
  Plain Ruby, no ActiveSupport.
- `app/models/break_escape/network_access.rb` (new): a concern included in `Game`, as `CarryOver`
  and `ScoreBreakdown` are. All of this slice's model code lives here, so `game.rb` takes only
  small hooks.
- `app/models/break_escape/game.rb`: `include NetworkAccess`; `stamp_scenario_object_ids!` also
  walks `resources.*.contents` (`<resourceId>_content_<n>`); `initialize_player_state` fills the two
  new keys.
- `test/support/network_model_scenario.rb` (new): the fixture the server tests share (two networks
  and a link, one with `downIf`; a Wi-Fi network with a key and an open one; a jack, a
  port-security jack and an access point; an open share and a protected share; three accounts; a
  sign-in PC in an unlocked room, one in a locked room, one under a `remote: "blocked"` policy).

Tests: `test/unit/network_model_test.rb` (new): membership from the object, from the room, and
neither; reach over one link and over two; a down network stops reach through it and from it; a
global read from `player_state` before the scenario default; ids stamped once, and a second run
changes nothing; a scenario with no `networks` returns empty answers everywhere.

### Step 2. Server withholding

Before any scenario is authored with a network.

Files:
- `game.rb`: `filtered_scenario_for_bootstrap` deletes `networks`, `networkLinks` and `resources`;
  `filter_requires_and_contents_recursive` deletes `network`, `portSecurity`,
  `portSecurityMessage`, `linkName` and `linkSprite` from every object, and `filtered_room_data`
  deletes the room's `network` and calls `attach_network_state!` (in the concern), which sets
  `jackPlanted` on jacks and composes `wifi` on access points.

Tests: `test/models/break_escape/network_withholding_test.rb` (new) and the no-exposure test
(section 6) in `test/controllers/break_escape/network_no_exposure_test.rb` (new), over the routes
that exist at this step; steps 3 and 4 add `/network` and the `/container` cases to it.

### Step 3. Server: footholds and the view

Files:
- `config/routes.rb`: `post 'network/plant'`, `post 'network/unplug'`, `post 'network/join'`,
  `get 'network'`.
- `games_controller.rb`: the four actions (thin: each calls one concern method and renders its
  `{ status:, body: }`, as `login` does); all four join the `set_game` list, and the three that
  write (`network_plant`, `network_unplug`, `network_join`) join the `with_game_lock` list; the `scenario` action adds `footholds` and
  `gainedFootholds`.
- `network_access.rb`: `object_reachable?`, `held_rogue_device`, `plant_device!`,
  `unplug_device!`, `join_wifi!`, `link_item_for`, `footholds_for_client`, `network_view`,
  `foothold_reaches?`.
- `game.rb`: `complete_task!` reads `gainedFootholds` for an `unlock_object` task on a jack or an
  access point.

Tests (`test/controllers/break_escape/network_footholds_test.rb`, new; every scenario through
`create_access_game`):
- plant: success moves the device out and the link item in and records both keys; a second plant
  answers `already: true` and writes nothing; no device, a device the client only claims to hold (a
  forged inventory field), an unreachable jack, an unknown jack and a port-security jack are each
  refused with the right status and leave the state alone;
- unplug: the device returns, the link item and foothold go, `gainedFootholds` keeps the jack;
- join: a wrong key is refused and nothing is counted; the right key, with spaces round it, joins;
  an open network joins with no key; a second access point of the same network answers
  `already: true`;
- the view: empty with no foothold; the foothold's own network with its PCs and resources in
  scenario order; a linked network listed with hosts when up and as one `up: false` entry with no
  hosts when down; nothing from an unlinked network; a PC under a `remote: "blocked"` policy listed
  with `remoteSignIn: false`; no `access`, username or content string anywhere in the answer;
- an `unlock_object` task on a jack completes after the plant, stays complete after an unplug, and
  does not complete before;
- reset clears both keys; the scenario response carries them.

### Step 4. Server: remote sign-in, usable sessions and shares

Files:
- `game.rb`: `attempt_login!` takes `foothold:` and runs section 5's checks; `start_login_session!`
  and `login_session_answer` carry `foothold` and `remote`; `login_scope_of` walks `resources`;
  `session_admits?` and `scope_admitted_by_session?` gain the `resource` case;
  `find_scenario_object` walks `resources` after the profiles; `login_desktop_contents` appends the
  share stubs; `find_login_item` also searches the shares mapped for that PC's session.
- `network_access.rb`: `session_usable?`, `resource_admits_player?`, `mapped_shares(pc, npc)`,
  `remote_blocked?(pc)`, and `end_sessions_through!(foothold_id)` (called by the unplug).
- `games_controller.rb`: `login` passes `foothold`; `container` uses `session_usable?`, answers the
  two 403 reasons and serves a resource through the scope branch; `render_login_desktop` the same;
  the inventory add takes `source_resource_id`; `find_object_in_scenario` and
  `find_accessible_item` walk `resources` (the generic search skips them).

Tests (`test/controllers/break_escape/network_remote_signin_test.rb` and
`network_shares_test.rb`, new):
- remote sign-in to a PC in a locked room succeeds through a foothold that reaches it, and the room
  stays locked; without a foothold, with a foothold on an unlinked network and with the link down
  it answers 403; a `remote: "blocked"` PC answers `remoteBlocked` for a right and a wrong password
  and counts no failure; wrong passwords count on the same counter as local ones and lock out at
  the policy's limit, remotely and locally alike; an account the PC does not admit gets the
  not-permitted answer; `claim: "owner"` with a foothold is refused;
- the desktop: served remotely with profiles; 403 `unreachable` while the network is down and
  served again when it is back, the session untouched; after an unplug the session is gone and the
  answer is 403 `no_session`; a local session at a PC in an unlocked room is unaffected by any of
  it;
- shares: an open share opens with a foothold and not without; a protected share appears as a stub
  on an admitted account's desktop and not on another's, and not when the PC has no network, the
  link is down or the resource's own `downIf` is set; its contents answer only then; Copy and Move
  from a mapped share and from an open share, each refused once the route is gone; a locked folder
  in a share is refused by `/unlock` and `/container` without the scope and opens with it;
- the no-exposure test gains the `/network` and `/container` cases; the first slice's
  `access_model_*` controller tests pass unchanged.

### Step 5. Validator, schema, dungeon graph and author docs

Files: `scripts/scenario-schema.json`, `scripts/validate_scenario.rb`,
`scripts/generate_dungeon_graph.rb` (section 7), and `README_scenario_design.md`: a "Networks"
section after "Item plants" (fields, the three footholds, what a foothold shows, shares, outages,
the events, and the two authoring rules: an outage is never protection, and a remote route skips
doors on purpose).

Tests: the two new node test files of section 7. The existing validator and graph tests pass
unchanged, and every existing scenario validates as before (none uses a new field; section 11).

### Step 6. Playtest tooling

Files:
- `tools/playtest/lib/access_leak_scanner.rb`: new secrets from the game's scenario data (every
  `wifi.psk`; every network `name`; every resource `name`, `host` and `observations`; the names and
  texts of items under `resources`). New rules: a Wi-Fi key anywhere except an authored clue text;
  a share item's content anywhere but a `GET /container` answer for that resource or a folder in
  it; a network or resource string in any response other than `GET /network`, a `/network/*`
  answer, a `/container` answer, the `footholds` block of `/scenario`, or an NPC's `work` block
  once slice 9.2 exists (12.3). As now, a finding names the rule, the route and the owner, never
  the value.
- `tools/playtest/verify-run.rb`: the `--access` section also prints `footholds`,
  `gainedFootholds`, and `remote` beside each session.
- `public/break_escape/js/systems/test-bridge/access.js`: read-only `footholds()` (what
  `network-links.js` holds) and `networkView(footholdId)` (the last view fetched). Documented in
  `docs/test-bridge.md`.
- `.claude/skills/playtest-scenario/SKILL.md`: one paragraph under "Access model checks".

Tests: `test/unit/access_leak_scanner_test.rb` gains a case per new rule (a network name planted in
room data is reported; the same name in a `/network` answer is not; a key in a poster's text is
not, in `/scenario` is; no output line holds a value); `test/js/playtest-verify-run-access.test.mjs`
and `test/js/test-bridge-access.test.mjs` gain the new fields.

### Step 7. Client: footholds, and the scenario `test_access_networks`

Files, under `public/break_escape/js/`:
- `api-client.js`: `networkPlant`, `networkUnplug`, `networkJoin`, `networkImplant`, `network`,
  and `foothold` in `login`'s fields.
- `systems/network-links.js` (new, `window.networkLinks`): the foothold list, filled from the
  server's answers and from the scenario response on load; `interactJack(sprite)`,
  `interactAp(sprite)`, `open(footholdId)`, `view(footholdId)` (sync, then `GET /network`);
  showing a link item from a route's inventory answer without a request; the jack's
  `plantedSprite`; the two published globals; every event of 3.5; the refetch on a global change.
  It is to networks what `pc-sessions.js` is to sessions: the only place the client asks.
- `systems/interactions.js`: three short branches in `handleObjectInteraction` after the sign-in PC
  branch (`networkJack`, `wifiAp`, and an inventory item of type `network_link`), each a call into
  `network-links.js` and a return.
- `minigames/password/password-minigame.js`: the Wi-Fi key mode (4.1).
- `core/game.js`: hand `footholds` and `gainedFootholds` to `network-links.js` where it hands
  `sessions` to `pc-sessions.js`.
- `systems/objectives-manager.js`: `network_foothold_gained` meets an `unlock_object` task on its
  source; the load-time reconcile also reads `gainedFootholds`.

Client tests (`test/js/`):
- `network-links.test.mjs` (new): a jack click with no device shows the resolved hint and sends
  nothing; with a device it confirms first, and a cancelled confirm sends nothing; a success shows
  the link item, publishes `<jackId>_planted` and emits `network_device_planted` and
  `network_foothold_gained` once each; a `port_security` refusal emits `network_device_refused` and
  keeps the device; a planted jack offers Open and Unplug; an unplug emits its event with
  `endedPcIds`; an access point click opens the key prompt, a wrong key emits `network_join_failed`,
  an open network joins with no prompt; on load the list is restored, a missing link item is shown
  again and no request is sent.
- An objectives test: the task completes on the event and on load from `gainedFootholds`.
- `interactions` routing: a jack, an access point and a link item each reach `network-links.js` and
  never the generic flow.

**`scenarios/test_access_networks`** (new; it follows the main plan's rules for feature scenarios:
`mission.json` in the `test_scenarios` collection, a `lobby` start room, a sign at each beat that
never holds a secret, one task per beat completed by a mapping on the beat's own event, and
`PLAYTEST.md` with one numbered step per beat and the server record expected after it). The whole
scenario is authored in this step; beats that need steps 8 and 9 get their static checks now and
their runs then.

Networks: `office_lan` ("Office LAN"); `server_net` ("Servers", `downIf: "server_net_down"`, which
defaults to true), linked to `office_lan`; `guest_wifi` ("Guest Wi-Fi", ssid `Harbour-Guest`, with a
key) and `free_wifi` ("Harbour-Free", open), linked to nothing. Policies: `hardened`
(`remote: "blocked"`) and `counted` (`maxAttempts: 5`). Accounts: Sam Okafor (`staff` only), Lena
Fox (`finance`), Ian Shaw (`it`), Mei Lin (`ops`). Resources: `scans` (open share, `office_lan`,
holding a scanned starter letter that gives Lena's password as a deliberate clue); `ledgers`
(share, `server_net`, `access: { roles: ["finance"] }`, holding an IT handover note with Ian's
password); `guest_printer` (a printer on `guest_wifi` with `observations`); `portal` (a service on
`free_wifi`). Only Mei has a need, one that decays too slowly to move her during a run, so the
needs system tracks her as sitting at her desk. Every room that holds a remote-only PC has a PIN
door whose code
appears later in the chain, so the validator sees every room as openable and a run can look at the
PC afterwards.

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| N1 Port security | `comms_room`: `secure_port`, a jack with `portSecurity`. The drop box (`rogueDevice`) is on a table in the `lobby` | Before taking the box, the jack shows its hint. With the box, the confirm appears; after confirming, the jack's message says the switch refused the device, and the box is still held | No `footholds`; the box in the inventory |
| N2 Plant | `comms_room`: `comms_port`, a jack on `office_lan` with `plantedSprite` | Cancelling the confirm changes nothing. Confirming plants it: the box leaves the inventory, the link item arrives, the jack changes look | `footholds.jack_comms_port` on `office_lan`; `gainedFootholds` has `comms_port`; the link item in the inventory |
| N3 See | The link item | The view lists Office LAN: `HB-DESK-01` (Sam's PC), `HB-FIN-02` (Lena's PC, in the locked `finance_office`), `HB-KIOSK-01` (remote sign-in off), the `Scans` share marked open. "Servers: no route". Nothing from either Wi-Fi network. The leak check over every response before N2 finds no network, host or share string | No change |
| N4 Open share | `Scans` in the view | It opens; the starter letter reads, and Copy puts it in the inventory and leaves it listed | `copiedItems` has the letter |
| N5 Remote sign-in | `HB-FIN-02` in the view; `lena_pc` is under `counted` and admits `finance` | No tiles. Sam's right password (from his PC's sticky note) answers "This account can't sign in on this PC". A wrong password for Lena answers with 4 attempts left. Her password from the letter opens her desktop, its header naming her and "Remote session through Drop box" | `sessions.lena_pc = { id: "lena", via: "password", foothold: "jack_comms_port" }`; `signedInPcs` has `lena_pc`; `finance_office` still locked; no failure entry for Lena |
| N6 Remote sign-in off | `HB-KIOSK-01` in the view; `kiosk_pc` is under `hardened`, in the open `kiosk_room` | The row offers no sign-in. At the kiosk itself, Sam's password signs in | `sessions.kiosk_pc` Sam, no `foothold` |
| N7 Repair the link | `plant_room`: `uplink`, an object whose click sets `server_net_down` to false (a second object sets it true) | After the repair the view lists Servers: `HB-SRV-01` (Ian's server, in the locked `server_room`) and the `Ledgers` share with a padlock. Lena's desktop, reopened from the view, now shows the mapped `Ledgers` folder; the handover note inside reads | `globalVariables.server_net_down` false after the sync |
| N8 Chain | `HB-SRV-01`; `ian_srv` admits `it` | Ian's username and password from the handover note open his desktop. A file in his profile gives the PIN for the `vault` in the `lobby`; the vault opens and the last task completes | `sessions.ian_srv` Ian, remote; the vault in `unlockedObjects` |
| N9 Outage | `plant_room`: the second object, pulling the uplink | The view shows "Servers: no route". **Open** on `HB-SRV-01` answers "No route to HB-SRV-01". Lena's desktop no longer lists `Ledgers`. After repairing the link again, `HB-SRV-01` opens with no password | `sessions.ian_srv` unchanged throughout |
| N10 Wi-Fi | `cafe`: `guest_ap` (the key is on a poster in the room) and `free_ap` | A wrong key answers "Incorrect key", any number of times. The poster's key joins: a "Wi-Fi: Harbour-Guest" link item, whose view lists only the guest printer and its note. `free_ap` joins with no prompt and lists only the portal. Neither view shows anything of the Office LAN | `footholds.wifi_guest_wifi` and `footholds.wifi_free_wifi`; no login failure entries |
| N11 Unplug | `comms_port`, with Lena's remote session held | **Unplug** returns the box and removes the link item; an open remote desktop closes with "The link dropped". Planting again and opening `HB-FIN-02` asks for the password again | After the unplug: no `footholds.jack_comms_port`, no `sessions.lena_pc`; `signedInPcs` and `gainedFootholds` unchanged |
| N12 Implant (step 9) | `ops_room`: `mei_pc` on `office_lan`, owned by Mei Lin, who stays at her desk and whose screen always locks; a "Found USB" object whose click runs `grant_foothold` for `mei_pc` with `"as": "owner"` (it stands in for Mei plugging the stick in) | A "Remote session: HB-OPS-03" link item arrives. Its view lists Office LAN with `HB-OPS-03` offering **Open session as Mei Lin**, which opens her desktop with no password while she sits at the PC. Clicking the PC itself still says she is using it | `footholds.implant_mei_pc` with `as: "mei"`; `sessions.mei_pc = { id: "mei", via: "implant", foothold: "implant_mei_pc" }` |
| N13 Reload | A drop box planted, Lena signed in remotely, the guest Wi-Fi joined | After the reload the link items are in the inventory, the jack shows its planted look, the views list the same hosts, Lena's desktop opens with no password and every task stays complete | `footholds`, `gainedFootholds`, `sessions` and `signedInPcs` unchanged |

Expected validator output: the "doors skipped" information lines for `lena_pc` and `ian_srv`, and
the `maxAttempts` warning the first slice gives for `lena_pc`. No errors.

**Static checks.** Validator clean apart from the expected lines, ink compiles (the scenario has
none beyond the signs' needs), dungeon graph generated, node and Rails suites, the no-password and
no-exposure tests.

**Scripted run for this step** (on :3001, headless, `--capture-responses` on, a private scratch
folder): N1, N2, N10 and N11, with a reload after N2 that checks the link item, the jack's look and
`gainedFootholds`. After each beat: `verify-run.rb <game_id> --access` against the record above,
and `access-leak-check.rb` over the responses so far.

### Step 8. Client: the network view, remote sign-in, shares and outages

Files, under `public/break_escape/js/`:
- `minigames/network-view/network-view-minigame.js` (new) and its stylesheet; registered in
  `minigames/index.js` as `network-view`. It renders one `GET /network` answer (4.3) and calls out
  for every action.
- `systems/unlock-system.js`: `openRemoteSignIn(host, footholdId)`, which builds the lockable the
  sign-in functions expect from a host row (`lockType: "login"`, `loginPicker: false`, and
  `remote: { footholdId }`), skips the `/login_accounts` refresh, and opens the desktop on success.
- `systems/pc-sessions.js`: `signIn` passes the foothold; a session keeps `remote` and
  `footholdId`, and the events carry them; a 403 with `reason: "unreachable"` keeps the session and
  reports "No route"; `network_device_unplugged` drops the sessions named in `endedPcIds` and
  closes their desktops with "The link dropped".
- `minigames/password/password-minigame.js`: in sign-in mode with `remote`, no tiles, and the
  **Captured sign-ins** list (4.4), read from `se_captures` and the `/capture_secrets` map through
  the functions `captures.js` already exports.
- `minigames/container/container-minigame.js`: the remote line in the desktop header; a
  `network_share` item opens as a folder whose contents are fetched from `GET /container/<id>`;
  an open share started from the view (`sourceResourceId`); the "No route" and "The link dropped"
  closes.
- `systems/inventory.js`: send `source_resource_id` beside `source_pc_id` and `transfer`.

Client tests (`test/js/`):
- `network-view.test.mjs` (new): it renders the foothold's network first, a down linked network as
  one line with no rows, a blocked PC with no sign-in action, an open share with Open and a
  protected one with the padlock text; it emits `network_viewed` once per listed network and
  `network_host_opened` on a click; it refetches on a global change; it never reads scenario data.
- `pc-sessions.test.mjs`: a remote sign-in sends the foothold and emits `pc_signed_in` with
  `remote: true`; `unreachable` keeps the session, `no_session` drops it; an unplug ends exactly
  the sessions named.
- `password-signin-mode.test.mjs`: remote mode shows no tiles whatever the picker; the captured
  list fills the username always and the password only when the secrets map has it.
- `container-shares.test.mjs` (new): a share stub fetches its contents on open; the inventory add
  from a mapped share carries `source_pc_id`, from an open share `source_resource_id`.

**Scripted runs.** Run A, a new game: N1 to N6, with a reload after N5 (Lena's remote session and
the view survive). Run B, a new game: plant, N4 and N5 briefly to earn Lena's password and session,
then N7, N8, N9 and N13. Then the step 7 run again, and the first slice's three suite runs
(`test_access_doors`, `test_access_signin`, `test_access_sessions`), because `session_usable?`, the
403 reasons and the sign-in screen changed under them. Console moves are not needed in any beat;
every password and key is read from its in-game source and listed in the earned-secrets table.

### Step 9. Implants (optional; decision 4)

Files:
- `config/routes.rb`, `games_controller.rb`: `post 'network/implant'`, locked.
- `network_access.rb`: `grant_implant!`, `claim_implant_session!`; `NetworkModel.declared_implants`.
- `games_controller.rb` `login`: `claim: "implant"`.
- Validator, schema and README: the `grant_foothold` action and its two errors (7.2).
- Client: `systems/apply-actions.js`, a `grant_foothold` case that calls
  `networkLinks.implant(action)`; `network-links.js` `implant`; the view's **Open session as**
  action; `pc-sessions.js` `claimImplant`.

Tests: server (`network_implant_test.rb`, new): an undeclared PC is refused; a declared one gives
the foothold and the link item; `as` is set only when the owner has an admitted account; the claim
opens the owner's session with the owner at the desk and the screen always locking, is refused
through any other foothold and never replaces a session already held; the session survives the
scenario response (it is not ended as a `claim` is). Client: the action calls the route once and a
repeat is harmless; the view offers the action only on the implant's own PC. Validator fixtures for
the two errors.

**Scripted run.** N12, then a reload, then N3 from the implant's link item (it reaches the same
Office LAN the drop box does). Then the step 8 runs again.

### Step 10. `lab_physical_pentest`

Section 10. It starts once the step 8 runs pass (and step 9's, if the lab uses implants).

## 10. How `lab_physical_pentest` adopts it

The lab's story text, rules of engagement, Ruth's lines, objectives and debrief belong to the lab
feedback plan (the user's note of 2026-11-10 says they must all change, because signing in with
captured credentials is now in scope). This section is the engine-facing recipe that plan can pick
up. Nothing here needs slices 9.1 or 9.2.

**The drop box beat, first class.**

- Top level: `"networks": { "office_lan": { "name": "Ledgerwell office LAN" } }`. One network is
  enough for this lab.
- `kit_dropbox` (briefing room) gains `"rogueDevice": true`.
- `network_port` (room `P3`) gains `"networkJack": true`, `"network": "office_lan"`,
  `"plantedSprite": "pi_cluster1"` and `"jackConfirm"` holding its present confirm text. Its
  `requiresItem`, `triggerOnInteract` and `confirm_action` go (the jack does all three), and its
  `requiresItemHint` stays. The box is now really planted: it leaves the inventory on confirm and
  comes back on unplug.
- `network_port_planted` is deleted: the jack's planted look, the link item and the view replace
  it. The lesson about the control stays where it already is, in the confirm text and in the
  finding's capture note.
- Ruth's mapping changes its trigger from `global_variable_changed:kp_netdrop_planted` to
  `network_device_planted:network_port`, keeps `onceOnly`, the `addCapture` and
  `completeTask: "opt_netdrop"`, and adds `setGlobal: { "kp_netdrop_planted": true }`, so her ink
  and the debrief keep reading the same global.
- The comms cupboard's finding is unchanged: the door was never locked and the port was live.

**What the box shows, and the chain.** A proposal for the lab plan to refine:

- `staff_pc_2` (Melanie's sign-in PC) gains `"network": "office_lan"` and `"host": "LW-OPEN-07"`,
  the host her capture already prints. `staff_pc` and `usb_target_pc` gain the network and their
  hosts (`LW-RECEP-01`, `LW-FIN-07`) so they are ready when the lab plan converts them to sign-in
  PCs; until then they are not listed (only sign-in PCs are hosts).
- `resources`: `lw_scans`, an open share on `LW-FS01` holding one or two scan-to-folder files (the
  finding: anything on the LAN reads the scanner's output); `lw_records`, the `\\LW-FS01\records`
  share the BadUSB text already names, with `access: { roles: ["finance"] }`; and
  `lw_door_controller`, a service row for the door-entry controller the store room note describes,
  with a one-line `observations`.
- The chain: plant the box; open the link; see `LW-OPEN-07`, the open scans share and the padlocked
  records share; sign in to `LW-OPEN-07` remotely as `m.pierce` with the password captured from her
  unlocked screen (the **Captured sign-ins** list offers it), or as `s.lord` with the password from
  the QR phish if the lab plan widens the PC's `access` from `{ people: ["pierce"] }` to
  `{ roles: ["finance"] }`; her desktop now carries the mapped records share; what the share holds
  is the lab plan's choice (the user's note points at Ledgerwell's own archive safe being in scope,
  so the safe's combination is the natural payoff). Chris's captured password answers "This
  account can't sign in on this PC" there, which teaches that an access list is a separate control.
- New optional tasks, each completed by a mapping on its own event: `network_viewed:office_lan`
  ("See what the drop box exposes"), `pc_signed_in:staff_pc_2` with `data.remote === true` ("Sign
  in with a captured password"), `network_share_opened:lw_records` ("Reach the records share").

**The BadUSB and the cable (only with step 9).** The `grant_remote_session` timer's `give_item`
becomes `{ "type": "grant_foothold", "pc": "usb_target_pc", "as": "owner", "name": "Remote session:
LW-FIN-07 (Sofia's PC)" }`, `usb_target_pc` becomes a sign-in PC owned by Sofia, and the hand-written
"Remote Session" container and its `records_share.txt` go: her desktop shows the real mapped
records share because she is in finance. The juice-jack cable can fire the same action (a second
grant of the same foothold is harmless), and `cable_note`, which the user reports as a PC sprite in
the middle of the room, becomes a note in the inventory container (the lab feedback plan). Without
step 9 both stay as they are today.

**Tests for the lab.**

- `test/models/break_escape/lab_physical_pentest_secrets_test.rb` gains: no room or bootstrap
  answer names the network, a share or a share file before the plant; the records share's contents
  are served only to a finance session whose PC reaches it.
- `scenarios/lab_physical_pentest/PLAYTEST.md` gains the beats: plant (the box leaves the
  inventory, the link item arrives, `opt_netdrop` completes); see; remote sign-in with the captured
  password, earned in the same run from Melanie's unlocked screen; the records share; unplug; a
  reload with the box planted.
- A scripted regression run of those beats with the two checks after each, then a persona run as a
  student who does not know the answers, judging whether the link item is discoverable, whether the
  view reads as "what my box can see", and whether the remote sign-in makes the consequence of a
  captured password clear. A persona run confirms any "stuck" a scripted run reports before it
  counts as a bug.

## 11. Effects on existing scenarios

No scenario uses `networks`, `networkLinks`, `resources`, an object `network`, `networkJack`,
`wifiAp`, `rogueDevice` or `grant_foothold` today (checked across `scenarios/`), so every change
below is inert until a scenario opts in.

| Change | Effect on a scenario that does not use networks |
|---|---|
| The bootstrap deletes three top-level keys | None: the keys are absent |
| The room filter deletes `network`, `portSecurity` and the link fields | None |
| `session_usable?` replaces the bare "PC reachable" test | Same answer: a session without a `foothold` is usable exactly when the PC is physically reachable |
| A `container` 403 carries a `reason` | `pc-sessions.js` treats `no_session` and a missing reason as it treats a 403 today |
| `POST /login` reads `foothold` | Without the parameter the route is unchanged |
| The desktop gains share stubs | None without `resources` |
| `login_scope_of`, `find_scenario_object` and the controller lookups walk `resources` | Nothing to walk |
| Three new branches in `handleObjectInteraction`, two new modes in the password minigame | Reached only by the new fields and parameters |
| Policy `remote` | Absent means allowed, and nothing can sign in remotely without a network |
| Validator | `check_network_model` returns at once when the scenario has none of the new fields |

Scenarios to rerun because shared code changes under them: the first slice's three suite scenarios
(step 8). `lab_social_engineering` hands out its own Remote Session through a declared grant and a
phish target's `foothold.containerId`; it is untouched, and could adopt implants later. The needs
scenarios are untouched: this slice changes nothing in `npc-needs.js` or `workstation-state.js`.

## 12. Interfaces with other slices

### 12.1 Changes this plan asks of the section 9 sketch

| Sketch (main plan, 9.2 and 9.3) | This plan | Why |
|---|---|---|
| "PCs, devices and resources carry `network`" | Kept, with the room default | |
| Reach: "same network, or joined through `networkLinks`" | Kept; made transitive through networks that are up | A down network must cut what lies behind it |
| A `wifi_ap` object with `network` and `psk` | The key moves to `networks.<id>.wifi`; the object is any object with `wifiAp: true` | One home for the secret, in a block that never ships; several access points can serve one network |
| A `network_jack` object | Any object with `networkJack: true` | The jack keeps its own sprite and type |
| A rogue device item with tag `rogue_device` | `rogueDevice: true` on the item | Items have no tag list |
| "Plugging one in gives the player reach to that network" | A foothold record on the server and a link item in the inventory | Something to open, to file in the user's container and to take back |
| `"requiresReach": "server_net"` on a resource or a VM launcher | Left out (section 15). A resource on a network needs reach by its nature | Game play in this mode has no VMs; the hook is stated for later |
| `resources` (9.2): `kind`, `network`, `access`, `downIf`, `object` | Kept; this slice adds `host`, `contents`, `observations` (and `name`, which the 9.2 draft adds too) | So a share is a game object the player can open |
| `resources`, `networks` in the bootstrap (not stated) | Never shipped as authored | The user's secrecy rule |
| Policies: `usb`, `social` | Adds `remote` | The control for remote sign-in |

### 12.2 Slice 9.1 (awareness and habits)

No dependency in either direction. Three contact points, none blocking:

- A password the `writesDown` habit puts on a sticky note signs in remotely as well as locally,
  with no extra work.
- The `password: "reused"` check may count a Wi-Fi key equal to an account password as reuse. The
  9.1 draft expects to read the key at `wifi_ap.psk` (its list of places a secret lives,
  `NpcHabits::Clues.secret_homes`); in this plan the key is at `networks.<id>.wifi.psk`, and
  whichever slice lands second adds that home to the list.
- An NPC noticing a planted device belongs with `challengesStrangers` if it is ever built; the
  event `network_device_planted` is the hook.

### 12.3 Slice 9.2 (work, frustration, social media)

The 9.2 draft (`ACCESS_MODEL_SLICE_9_2_PLAN.md`, read on 2026-11-10 while both were being written)
agrees with this plan on most of the shared surface. The points below say where they meet and the
two changes this plan asks of it.

- **`resources` is shared.** Both drafts define `name`, `kind`, `access`, `downIf` and `network`
  the same way, and the 9.2 draft accepts `network` and carries it for this slice. This slice adds
  `host`, `contents` and `observations`; 9.2 owns `object`, `roles.<role>.workNeeds` and the NPC
  `workNeeds` list. Whichever is built first adds the top-level key to the schema and the
  validator's known keys; the other extends it. Neither may make the other's fields required, and
  both delete `resources` from the bootstrap.
- **A resource with no `access`** means the same in both: anyone who can reach it may use it.
- **Requested change 1: reach for NPC work is computed on the server.** The 9.2 draft judges a
  work use in the browser and asks one hook, `reaches(stationId, resource)`, which "answers true
  until slice 9.3 supplies it", and it ships each resource's `network` to the browser in the NPC's
  `work` plan for that purpose. A browser-side reach test would need `networks` and `networkLinks`
  in the browser, which this slice withholds. So this plan asks 9.2 to drop `network` from the
  `work` plan and take reach from the server instead: when the plan is composed, each need gains
  `routes`, the answer of `NetworkModel.reach_conditions(station_network, resource)`: a list of
  routes, each a list of `downIf` global names along it (an empty list of routes means never
  reachable; one empty route means always reachable). `reaches` then stays a pure browser function,
  true when some route has no truthy global, and no network id or link ships. If 9.2 is built
  first its hook answers true and nothing else changes; when this slice lands it adds `routes` in
  the one place the plan is composed.
- **Requested change 2, for the user to weigh: resource names in room data.** The 9.2 draft ships
  each resource's `id`, `name` and `kind` in the `work` plan of every NPC who needs it, in that
  NPC's room data. That shows a player who reads the traffic that "Finance share" exists before
  they have any foothold. It exposes no host, no contents and no access list, and an NPC's bark
  about a share being down says as much, so this plan treats it as acceptable and scopes its own
  no-exposure test and leak rule to exclude an NPC's `work` block. If the user wants the stricter
  reading, 9.2 ships an opaque index in place of `id` and `name`.
- **A PC with no `network`.** Proposed common rule: in a scenario with no `networks` block, reach
  is always true (9.2 works without networks, as its draft says); in a scenario that has one, an
  object with no network reaches nothing. The 9.2 draft's server rule for when a use can fail
  gains "or the scenario has networks", as that draft already notes.
- **A station that is down.** The 9.2 draft adds `downIf` to a workstation object. When both slices
  exist, a sign-in PC whose own `downIf` is truthy is listed in the view as "not responding" and
  refuses remote sign-in: one line each in `network_view` and `session_usable?`, added by
  whichever lands second.
- **The hot desk.** A guest session that 9.2's `borrow_session` leaves at a hot desk is an ordinary
  session at a PC on a network, so its desktop carries the mapped shares with no extra work. It is
  claimed at the screen, never over the network.
- **Outages.** `downIf` means the same in both slices: the global truthy means down. 9.2 owns what
  an outage does to NPCs; this slice owns what it does to the player's reach.
- **Policy.** 9.2 gives `usb` and `social` their behaviour; this slice adds `remote`. A BadUSB at a
  PC under `usb: "blocked"` fails at the drop under 9.2's rule, before any `grant_foothold` runs,
  so the two do not interact in code. Whichever lands second adds a validator warning for a
  `grant_foothold` whose PC's policy blocks USB.
- **Social media feed.** A post is one of the places a Wi-Fi key can be learned. The validator's
  "the key appears nowhere" warning should read `feed[].text` once 9.2 exists.
- **Files both builds touch:** `game.rb`, `validate_scenario.rb`, `scenario-schema.json`. This
  slice keeps its model code in `network_access.rb` and `network_model.rb` and its validator code
  in one function to keep the overlap to a few hook lines. It does not touch `npc-needs.js` or
  `workstation-state.js`.

### 12.4 The inventory container (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`)

The user wants captured credentials, notes and remote sessions in one container in the player's
inventory. This slice works without it and is ready for it. What it needs from that design:

1. Inventory items of type `network_link` are filed in the container automatically, as the
   lab's Remote Session item will be. They are added by the server and arrive in a route's
   `inventory` answer or in `playerInventory` on load, so the container must accept an item that
   was not added through `addToInventory`'s request.
2. Opening an entry runs the item's ordinary click (`handleObjectInteraction` on its sprite), which
   this slice routes to `window.networkLinks.open(footholdId)`. No container-specific opener is
   needed.
3. An entry disappears when a server inventory answer no longer holds the item (an unplug).
4. The planned inventory menu ("drop here", "examine") offers a link item **Open** and **Examine**
   only. A rogue device before it is planted is an ordinary item and may be dropped if the lab
   wants that.
5. The **Captured sign-ins** list on the remote sign-in screen reads `se_captures` and the
   `/capture_secrets` map directly, so it does not depend on the container. If the container gives
   captured credentials a new shape or store, it should keep `readCaptures` and `displaySecret`
   (`systems/captures.js`) working or offer an equivalent the sign-in screen can call.
6. Files both builds touch: `systems/inventory.js` and `systems/interactions.js`. This slice's
   edits there are one parameter and three short branches; each builder re-reads the file just
   before editing.

### 12.5 Declared grants and SecGen VMs

- Declared grants are unchanged. A Remote Session item given by `give_item` keeps working; step 9
  offers a better representation and the scenario chooses.
- The bridge to real VMs (a VM launcher that needs reach) is left out. When it is wanted, the
  server-side question "does the player reach network N" is `foothold_reaches?` for any held
  foothold, and the client-side list is in `network-links.js`.

## 13. Order and parallel streams

**This slice can be built before 9.1 and 9.2, and should be**, since the lab feedback wants the
drop box beat soon. It depends only on what the first slice built (accounts, sign-in, sessions,
profiles, policies, the scoped-object checks, the playtest tooling). It needs no habit, no
frustration and no social media. The only shared surface is the `resources` key and the reach
table of 12.3, and both work in either order.

Streams, by file ownership, so that no two builders edit the same file at the same time:

| Stream | Steps | Owns | Starts |
|---|---|---|---|
| S, server | 1, 2, 3, 4 | `lib/break_escape/network_model.rb`, `app/models/break_escape/network_access.rb`, the hooks in `game.rb`, `games_controller.rb`, `config/routes.rb`, `test/unit/network_model_test.rb`, `test/models/**/network_*`, `test/controllers/**/network_*`, `test/support/network_model_scenario.rb` | At once |
| T, tooling and authoring | 5, 6 | `scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `scripts/generate_dungeon_graph.rb`, `README_scenario_design.md`, `tools/playtest/**`, `systems/test-bridge/access.js`, `docs/test-bridge.md`, the playtest skill's paragraph, and their tests | When step 1's `network_model.rb` is in (the validator requires it) |
| C1, client footholds | 7 (client files) | `systems/network-links.js`, `api-client.js`, `systems/interactions.js`, `core/game.js`, `systems/objectives-manager.js`, the Wi-Fi key mode in `password-minigame.js`, and their tests | At once, against the route shapes in sections 5 and 6 (node tests stub the API); browser checks when step 3 is in |
| C2, client view and remote sign-in | 8 | `minigames/network-view/**`, `minigames/index.js`, `systems/unlock-system.js`, `systems/pc-sessions.js`, `minigames/container/container-minigame.js`, `systems/inventory.js`, the remote sign-in mode in `password-minigame.js`, and their tests | The view at once, against section 6's answer; the rest when C1's `network-links.js` and step 4 are in |
| F, feature scenario | 7 (scenario), then the runs of 7 and 8 | `scenarios/test_access_networks/**` | When stream T's validator is in |
| Step 9 | 9 | One builder after step 8, touching small parts of S's and C1's files | After step 8's runs pass |
| Lab | 10 | `scenarios/lab_physical_pentest/**`, with the lab feedback plan | After step 8 (or 9) |

`password-minigame.js` is the one file two streams edit (C1 the Wi-Fi key mode, C2 the remote
sign-in mode). C1 goes first; C2 re-reads the file before editing. Every builder re-reads `game.rb`,
`games_controller.rb`, `interactions.js` and `inventory.js` just before editing, because the 9.1,
9.2 and lab feedback builds may be in them too, and commits with explicit paths.

Review and playtests follow `AGENTS.md`: at least two adversarial review rounds of this plan before
any build, an implementation review after each stream, and the scripted runs listed in the steps.

## 14. Decisions for the user

Each has a recommendation. The plan is written as if the recommendation is taken.

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | Build this slice before 9.1 and 9.2? | Before; or in the main plan's order, last | **Before.** It needs nothing from them, and the lab's drop box beat is waiting on it |
| 2 | Is remote sign-in on by default? | On for every sign-in PC a foothold reaches, unless its policy says `remote: "blocked"`; or off unless a PC opts in | **On by default.** It makes captured credentials matter everywhere with no authoring, which is the chaining the user asked for, and the policy field shows the control |
| 3 | How does a share with an access list open? | Only from the desktop of an account that may use it (a mapped drive); or also from the network view by typing a username and password | **From the desktop only.** One sign-in mechanic, and it shows that shares follow the account |
| 4 | Implants (step 9): build now? | Build as the last step; or leave the lab's BadUSB remote session hand-made | **Build, last.** It is small once steps 1 to 8 exist, and it turns the lab's most striking beat into a real session on Sofia's account. It can be cut without touching the rest |
| 5 | Can the player take a planted device back? | Yes, with Unplug, which ends the sessions through it; or planted for good | **Yes.** It prevents a soft lock with one box and two jacks, and "collect your kit" is good practice to teach |
| 6 | Does Wi-Fi need a device or a range? | Neither; or a laptop item and a list of rooms in range | **Neither.** The server could not check range, and the key is the puzzle |
| 7 | Art | Reuse existing sprites for link items and access points now; or commission a link icon, a Wi-Fi icon and a router sprite first | **Reuse now** (`drop_box1`, `pi_cluster1`, `network_rack1`, the phone image), and ask for three small PixelLab sprites when the lab adopts the feature |
| 8 | How far does the lab's drop box go? | See what is exposed only; or the full chain: remote sign-in with the captured password, then the records share | **The full chain, as optional objectives.** It is what "illustrate the consequences" asks for. The lab feedback plan writes the text |
| 9 | A linked network that is down shows as "no route", which reveals its name | Show it; or hide it entirely until it is up | **Show it.** It is the only cue that an outage puzzle exists |
| 10 | Slice 9.2's draft puts the names of the resources an NPC works with in that NPC's room data (12.3) | Accept it; or have 9.2 ship opaque labels | **Accept it.** It names a share and nothing more; hosts, contents and access lists stay behind a foothold. Either way 9.2 should take reach from the server, not ship the network |

## 15. Left out, on purpose

- **Per-service rules, firewalls, one-way links.** A link exists or it does not.
- **Pivoting through a PC on two networks.** The hook is cheap when a mission needs it: `network`
  would accept a list, and reach would add the networks of any PC the player holds a session on.
- **Wi-Fi range and client devices.**
- **`requiresReach`** on objects and VM launchers, and with it the bridge to SecGen VMs (12.5).
- **Opening a share by typing credentials** in the network view (decision 3).
- **Detection.** NPCs noticing a planted device, an intrusion alarm on failed remote sign-ins, and
  logs for a defender mission. The events of 3.5 are the hooks.
- **A bypass for port security** (cloning a printer's address, for example). `portSecurity` only
  refuses.
- **Outages the server establishes itself.** A `downIf` global is client-written (4.6).
- **Plain workstations and legacy password PCs as hosts.** Only sign-in PCs are listed. A scenario
  that wants a PC on the network converts it, as the first slice did for `staff_pc_2`.
- **NPC behaviour of any kind.** That is slices 9.1 and 9.2.
