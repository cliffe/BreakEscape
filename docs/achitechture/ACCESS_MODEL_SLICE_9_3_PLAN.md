# Access model slice 9.3: networks

Status: **design, 2026-11-10, not built.** It replaces the sketch in section 9.3 of
`ACCESS_MODEL_PLAN.md` (called "the main plan" below). Sections 3 to 8 of the main plan are built and
are the base this slice stands on. Claims about existing code were checked against the working tree
on 2026-11-10; method names are the stable reference, line numbers move.

The slice is in two parts:

- **9.3a, build-ready (sections 3 to 11).** One device in a network jack, the link item, the
  network view, remote sign-in with captured credentials, hosts with no screen of their own, file
  shares, and the secrecy and tooling that go with them. It is what the drop box in
  `lab_physical_pentest` needs, and it is built before any other later slice.
- **9.3b, an ordered design (section 12).** Links between networks crossed by a pivot through a
  held session, outages, Wi-Fi, port security and implants. Its scenario fields are reserved by
  9.3a's schema so no scenario changes shape later.

How to read this plan: section 2 says what exists today, section 3 lists 9.3a's scenario fields,
section 4 the engine behaviour, section 5 every route with its checks in the order they run,
section 6 what reaches the browser, sections 7 and 8 the validator and saved games, section 9 the
build steps with their tests and the feature scenario, section 10 the lab recipe, section 11 the
effects on existing scenarios, section 12 the 9.3b design, section 13 the interfaces with the other
plans, section 14 the build streams, section 15 the decisions, and sections 16 and 17 what is left
out and what was declined.

## 1. What this slice adds, and why now

The first slice made a captured password or a copied card worth exactly its owner's access, at a PC
or a door the player can walk up to. This slice adds the second gate the main plan names: **what can
be reached at all**. It makes "plant a device on a network, then see and reach what that network
exposes" one chainable mechanic:

1. **Get a foothold** on a network: plug a rogue device into a network jack.
2. **See** what that network exposes: its hosts (sign-in PCs, and devices that have no screen and
   are managed only over the network), its file shares and its other services, as a list the server
   composes for that foothold.
3. **Reach** it: sign in to a listed host from where the player stands, with a username and
   password captured somewhere else, and get that account's desktop, with the shares the account
   may use mapped on it.
4. **Chain**: what the desktop or the share holds is the next password, code or card. In 9.3b a
   session is also a place to stand: the next network is reached through a host the player has
   signed in to, never for free.

User feedback after the hands-on test of `lab_physical_pentest` (2026-11-10,
`physical_pentest_followup/USER_FEEDBACK_2026-11-10.md`) asks for this: "If we have authority to
plant a network device in the router, surely it's in scope to connect to see what's been exposed?"
and "accessing the desktops with captured creds should be in scope, to best illustrate the
consequences". The user's design principles apply throughout: chaining is the point; fun and
educational; simple enough for a pixel art game; and the server decides reach, so nothing a network
exposes is sent to the browser before the player has a foothold on it.

**Two rules the whole design keeps.**

- **A step that must not be skipped ends in something the server checks.** A plant is checked
  against the server's inventory; a sign-in against the password on the server. Anything the
  browser merely claims (a global, a capture entry) can pace a puzzle and fill in a form, and can
  never be the only thing between the player and a secret.
- **A captured password is a key because the server checks it, not because the player holds a
  capture.** `se_captures` is written by the browser. Remote sign-in does not read it. The capture
  list on the sign-in screen (4.4) only types for the player what they could type themselves. So
  the server-side check of captures that the engine feedback plan is designing is welcome and is
  not a dependency of this slice.

## 2. What exists today (verified)

| Area | Today | Where |
|---|---|---|
| Networks | Nothing. No scenario has a top-level `networks`, `networkLinks` or `resources` key, and no object has a `network` field. The `network-architecture` and `network-segmentation-map` minigames belong to the serious games and are unrelated | `scripts/scenario-schema.json`, `scenarios/*/scenario.json.erb` |
| Sign-in | `POST /login` checks "PC reachable" first: the PC's room is unlocked or never locked and nothing above the PC is still locked. Then the lockout, the password and the PC's `access` | `Game#attempt_login!`, `Game#login_pc_reachable?` |
| Sessions | `player_state.sessions[pcId] = { id, via }`, `via` being `password` or `claim`. The desktop is served by `GET /container/:id`, which checks the PC is reachable and a session is held, then composes the PC's `contents` and the admitted `accountProfiles` | `games_controller.rb` `container`, `render_login_desktop`; `Game#login_desktop_contents` |
| Scoped objects | `login_scope_of` finds an object by id or name, rooms first, and says whether it sits under a sign-in PC or in a profile. A sign-in PC itself is returned with no scope and guarded by a special case in `unlock_scope_refused?`. `session_admits?` asks only whether a session exists that admits the scope; it does not test whether the PC is reachable. Neither does the inventory add from a desktop | `game.rb`; `validate_login_item_collectible` |
| Access lists | `Game.acl_admits?` answers false when the list is not a hash. Only `pc_admits_account?` reads a missing list as "everyone" | `game.rb` |
| The sign-in screen | `openLoginSignIn` first asks `GET /login_accounts` and, on a 403 or 404, shows "This PC can't be reached" and returns. The desktop's Switch user button and the desktop's 403 fallback both call it | `unlock-system.js`, `container-minigame.js` |
| Captures | `se_captures` is written by the client and synced. `GET /capture_secrets` serves an account holder's password only for an entry whose `address` is that account's username, under `social.captures.revealSecret`. A landing-page capture's address is not an account username | `Game#capture_secrets_for_client` |
| Remote session (lab) | A declared grant: a timer's `give_item` hands the player a `pc` item, "Remote Session: LW-FIN-07", whose text files are hand-written. Nothing in it is connected to an account, a PC or a share | `lib/break_escape/declared_grants.rb`, `Game#held_grant_items` |
| Drop box (lab, as in this repository) | `network_port` is a `pc` object with `requiresItem: "kit_dropbox"` and a `confirm_action` that sets the global `kp_netdrop_planted`. The box stays in the inventory. A second object, `network_port_planted`, is revealed by the global. A mapping on Ruth adds a "foothold" capture and completes `opt_netdrop` | `scenarios/lab_physical_pentest/scenario.json.erb`, room `P3` |
| Bootstrap | `filtered_scenario_for_bootstrap` deep-copies the whole scenario and deletes what must not ship. Rooms are reduced to a whitelist of fields. **Any new top-level key ships as authored unless this method deletes it** | `game.rb` |
| Globals | Written by the client and merged by `PUT /sync_state` every 30 seconds and on page hide. Today the server never sets a scenario global itself (slice 9.2 plans one case where it does) | `Game#merge_global_variables!`, `state-sync.js` |
| Positions | The server cannot see where the player stands. "Reachable" on the server means "the room is unlocked or never locked" | main plan 4.2 |
| Inventory | An add is validated and the server stores its own copy of the item. The add for a room item checks that the room is open and the item takeable; it does not ask whether the item was taken before. A remove is not checked. Room data hides a taken item through `objects_removed`, with "it is in the inventory" as the fallback | `games_controller.rb` `inventory`, `find_accessible_item`; `Game#apply_room_state_changes!` |
| Inventory on the client | Items in `playerInventory` are restored on load without a request, through `createInventorySprite` (not exported) and a private `_restoredFromSave` flag | `systems/inventory.js` |
| Prompts | `window.gameConfirm(text)` is OK or Cancel. There is no two-choice prompt | `systems/notifications.js` |
| A click on an object | Order in `handleObjectInteraction`: a sign-in PC's own branch, then the workstation call, then `triggerOnInteract` with `requiresItem`, then drops, consumables and the generic flow | `systems/interactions.js` |
| Minigame scenes | Registered with `MinigameFramework.registerScene` in `minigames/index.js`. `systems/minigame-registry.js` is a different table: object type to starter function | both files |

## 3. Scenario fields (9.3a)

One complete example first; the subsections say what each part means.

```jsonc
{
  "networks": {
    "office_lan": { "name": "Harbour office LAN" }
  },

  "resources": {
    "scanned_inbox":  { "kind": "file_share", "name": "Scanned-Inbox", "host": "HB-FS01",
                        "network": "office_lan",
                        "contents": [ { "id": "scan_0412", "type": "text_file",
                                        "name": "scan_0412.pdf", "takeable": true, "text": "..." } ] },
    "ledger_archive": { "kind": "file_share", "name": "Ledger-Archive", "host": "HB-FS01",
                        "network": "office_lan", "access": { "roles": ["finance"] },
                        "contents": [ /* ... */ ] },
    "print_queue":    { "kind": "printer", "name": "Office print queue", "host": "HB-PRN-01",
                        "network": "office_lan",
                        "observations": "A print queue anyone on the LAN can read." }
  },

  "policies": { "hardened": { "remote": "blocked" } },

  "rooms": {
    "comms_room": {
      "network": "office_lan",                       // default for this room's objects
      "objects": [
        { "id": "comms_port", "type": "pc", "sprite": "network_rack1", "name": "Spare wall port",
          "networkJack": true,
          "jackConfirm": "Plug the drop box into this port?",
          "plantedSprite": "pi_cluster1",
          "linkName": "Drop box: comms room" }
      ]
    },
    "finance_office": {
      "network": "office_lan",
      "objects": [
        { "id": "lena_pc", "type": "pc", "name": "Lena's PC", "host": "HB-FIN-02",
          "locked": true, "lockType": "login", "access": { "roles": ["finance"] } }
      ]
    },
    "store": {
      "objects": [
        { "id": "door_box", "type": "pc", "sprite": "network_rack1", "name": "Door controller",
          "host": "HB-DOOR-01", "network": "office_lan",
          "locked": true, "lockType": "login", "headless": true,
          "access": { "roles": ["it"] },
          "observations": "A door controller with no screen or keyboard. It is managed over the network.",
          "contents": [ /* its admin pages, as files */ ] }
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

### 3.1 Networks

- `networks` is a map of network id to `{ name }`. `name` is what the player sees once they have a
  foothold on it.
- In 9.3a a foothold reaches its own network and nothing else. Two networks in one scenario are two
  separate places, each needing its own foothold.
- Reserved for 9.3b and refused by 9.3a's validator with "needs slice 9.3b": top-level
  `networkLinks`; `downIf` and `wifi` on a network; `wifiAp` and `portSecurity` on an object; the
  `grant_foothold` action.

### 3.2 Membership

- A room object may carry `network`. A room may carry `network` as the default for its objects; an
  object's own value wins. An object with neither is on no network.
- In this slice membership matters for sign-in PCs (which become hosts) and jacks. Slice 9.2 also
  uses a plain workstation's network for NPC work (13.2).
- `host` on a sign-in PC is its label on the network ("HB-FIN-02"). Without it the PC's `name` is
  used. It is not secret: capture entries already print host names.

### 3.3 The jack and the rogue device

- A jack is any room object with `"networkJack": true` and a network (its own or its room's). The
  sketch's `network_jack` object type is a field here, so a wall port, a patch panel or the back of
  a router can each be a jack with its own sprite.
- A rogue device is a takeable item with `"rogueDevice": true` and an `id` (the sketch's
  `rogue_device` tag; items have no tag list, only the single `needsTag` the needs system uses).
  Its definition may sit wherever an item can be picked up or granted: a room object, a container's
  `contents`, `startItemsInInventory`, an NPC's `itemsHeld`, or a declared grant.
- Optional jack fields: `jackConfirm` (the confirm text; default "Plug <device name> into
  <jack name>?"), `plantedSprite` (the jack's texture while a device is in it), `linkName` (the name
  of the link item, 4.1), `linkStoreIn` (13.4), and `requiresItemHint` with
  `requiresItemHintVariants` (the refusal when no rogue device is held, read through the existing
  `requiresItemHint` resolver).
- A jack takes no `triggerOnInteract`, no `requiresItem`, no lock and no `lockType`: its click is
  the plant flow (4.1). The validator errors on the combination, as it does for a sign-in PC.

### 3.4 What a network exposes

Two kinds of thing, and only these, appear in a foothold's view.

**Sign-in hosts.** Every `lockType: "login"` object on the foothold's network is listed as a host,
whatever room it is in and whether or not the player has ever opened that room.

- Remote sign-in is allowed unless the PC's policy says `"remote": "blocked"` (a new policy field
  beside `usb` and `social`; values `allowed` and `blocked`; absent means allowed). A blocked PC is
  still listed, marked "remote sign-in off": the player sees the control.
- `"headless": true` on a sign-in object says it has no screen or keyboard: a door controller, a
  file server in a rack, a printer's admin page. It can be signed in to **only** over the network.
  A click on the object shows its `observations` and nothing else, and the server refuses a
  sign-in there that names no foothold. This is the field that makes a chain need the foothold:
  the object can stand in a room the player walks through and still be out of reach until a device
  is on its network. A headless host has no owner, takes no claim and shows no account tiles.

**Resources.** `resources` is the registry the main plan sketches in 9.2. Slice 9.2 owns `name`,
`kind`, `access`, `downIf` and `object` on it for NPC work. This slice reads `name`, `kind` and
`access` the same way and owns four more fields:

| Field | Meaning |
|---|---|
| `network` | Required for the resource to be visible to a foothold. A resource with no network is never listed and never mapped |
| `host` | The machine it lives on, as a label: "Ledger-Archive on HB-FS01" |
| `contents` | `file_share` only: items, as in an account profile. Ids are global |
| `observations` | For a resource with no contents: the text shown when the player clicks its row |

A resource with no `access` is open to anyone who can reach it. A file share is the network
counterpart of an account profile: contents gated by an access list rather than a lock. How the
player opens one is in 4.5.

### 3.5 Tasks, events and globals

- An `unlock_object` task whose target is a jack is met when a foothold has ever been gained from
  it (the rule a sign-in PC already has with `signedInPcs`). An `unlock_object` task on a sign-in
  host is met by a remote sign-in exactly as by a local one.
- Events, each emitted under its bare name and as `<name>:<id>` (the id in brackets):

| Event | Data | When |
|---|---|---|
| `network_foothold_gained` (source id) | `{ footholdId, via, networkId, sourceId }` | Any foothold: `via` is `jack` in 9.3a; `sourceId` is the jack |
| `network_device_planted` (jack id) | `{ jackId, footholdId, networkId, deviceId }` | A plant succeeded |
| `network_device_refused` (jack id) | `{ jackId, reason }` | `reason`: `no_device` in 9.3a |
| `network_device_unplugged` (jack id) | `{ jackId, footholdId, endedPcIds }` | The player took the device back |
| `network_viewed` (network id) | `{ footholdId, networkId, hostIds, hostList }` | The view opened or refreshed and listed that network's hosts; `hostList` is the ids comma-joined for mapping conditions. It fires on every open, so a mapping that should fire once says `onceOnly` (which is saved across reloads) |
| `network_host_opened` (host id) | `{ footholdId, hostId, kind }` | The player clicked a host row |
| `network_share_opened` (resource id) | `{ resourceId, via, pcId }` | A share's contents loaded; `via` is `foothold` (from the view) or `session` (a mapped share on a desktop) |
| `pc_signed_in`, `pc_signed_out` | gain `remote` (true when the sign-in went through a foothold) and `footholdId` | As in the main plan 5.3 |
| `pc_signin_failed` | `reason` gains `remote_blocked` | A remote sign-in at a PC whose policy blocks it |

- One global the client publishes, as the workstation layer publishes `<id>_screen_locked`:
  `<jackId>_planted`, for `observationVariants`, hint variants and `revealOnGlobal`. A scenario that
  reads it declares it in `globalVariables`, as scenarios do for the workstation globals. It is
  display state only; the server never reads it.

## 4. Engine behaviour (9.3a)

### 4.1 Footholds, the planted device and the link item

**State.** Two new `player_state` keys, added to `ACCESS_STATE_DEFAULTS` (the constant the first
slice's keys use, so `initialize_player_state` fills them and a reset drops them):

| Key | Shape | Meaning |
|---|---|---|
| `footholds` | `{ footholdId: { via, network, source, device, seq } }` | The footholds held now. `footholdId` is `jack_<jackId>`. `device` is the server's copy of the planted item, so an unplug can give it back. `seq` orders them |
| `gainedFootholds` | list of source ids | Every jack a foothold was ever gained from (for tasks) |

A session opened over the network also records it: `sessions[pcId] = { id, via: "password",
foothold }`.

**One device is one device.** While a device is planted it is neither in the inventory nor in its
room, and nothing may hand out a second one:

- `plant_device!` removes the item from the inventory, keeps its copy in the foothold and, when the
  device was defined as a room object, adds its id to that room's `objects_removed`.
- One helper, `planted_device?(item)`, is true when an item's identity matches any
  `footholds.*.device`. `POST /inventory` add refuses such an item ("already in use"), and
  `apply_room_state_changes!` hides it from room data, beside the existing "it is in the inventory"
  rule. So a lost `objects_removed` write, or a hand-made add request, cannot bring the box back
  while it is in the wall.
- An unplug puts the same copy back in the inventory, once.

**The link item.** A foothold is something the player holds, so the server puts a handle for it in
the inventory in the same request that creates the foothold, and answers with the inventory. Its
exact shape, which the capture log container can rely on (13.4):

```jsonc
{ "id": "netlink_jack_comms_port",       // "netlink_" + footholdId; unique, stable across reloads
  "type": "network_link",
  "name": "Drop box: comms room",        // the jack's linkName, else "<device name>: <jack name>"
  "sprite": "drop_box1",                 // the planted device's own sprite (else its type)
  "takeable": false,
  "footholdId": "jack_comms_port",
  "sourceId": "comms_port",
  "observations": "Your drop box on Spare wall port. Open it to see what it reaches.",
  "storeIn": "capture_log" }             // only when the jack sets linkStoreIn
```

- It has no `contents` and no `hasContents`: it is not a container. Its own click is its opener
  (the network view, 4.3). It cannot be dropped and has no `droppable` field.
- The client shows it from the route's answer with no second request (step 7 adds the two exported
  functions `inventory.js` needs for that). It leaves the tray when an answer's inventory no longer
  holds it (an unplug).
- The foothold, not the item, is what the server checks. A client that removes the item loses only
  its handle; `network-links.js` shows a missing handle again from the `footholds` list on load.
- A remote session is not an item. It is the `sessions[pcId]` record, reached from its host's row
  in the view.

**Planting.** A click on a jack runs in `network-links.js`, from a branch in
`handleObjectInteraction` placed after the sign-in PC branch:

1. A device is planted here: `window.gameConfirm("Unplug <device name>?")`. OK unplugs; Cancel does
   nothing. (The view is opened from the link item, so the jack needs only the one question and
   the existing OK or Cancel prompt is enough.)
2. No rogue device is held: the jack's resolved `requiresItemHint`, as an item plant refuses today.
3. Otherwise `window.gameConfirm` with `jackConfirm`. The device is taken only after the player
   confirms and the server accepts, so a cancel loses nothing (the lab could not use `consumesItem`
   for this reason: the engine consumes a required item as the confirm opens).
4. On success: the device leaves the tray, the link item arrives, the jack shows `plantedSprite`,
   `<jackId>_planted` is published, the events fire, and **the network view opens by itself** the
   first time a foothold is gained from that jack. Seeing what is exposed is the point, so the
   player is shown it and not left to find a new tray icon.

**Unplugging** returns the device, removes the link item and the foothold, and ends every session
whose `foothold` is that foothold (an open remote desktop closes with "The link dropped"). A
scenario with one drop box and two jacks therefore cannot be soft-locked by planting in the wrong
one.

### 4.2 Reach

One shared module, `lib/break_escape/network_model.rb`, plain Ruby so the server, the validator and
the dungeon graph agree (as `access_identities.rb` does for identities).

- A **foothold reaches** its own network. A **PC reaches** its own network.
- A PC or a foothold reaches a resource when the resource's `network` is that network.
- Rights still come from access lists. Reach is the second gate, never a replacement for the first.
- `NetworkModel.reach_conditions(station_network, resource)` is the function slice 9.2 calls to
  compose an NPC's work plan (13.2). In 9.3a it answers `[[]]` (one route with no conditions) when
  the resource has no `network` or is on the station's network, and `[]` (no route) otherwise.
  9.3b extends the same answer with links and outages.

### 4.3 The network view

Clicking a link item opens a new minigame scene, `network-view`, in the desktop window chrome the
container minigame uses. It shows what `GET /network` answers for that foothold and nothing else:

- a header: the link's name and its network ("Drop box: comms room, on Harbour office LAN");
- a row for each sign-in host: host label, name, and one action:
  - **Sign in**, when no session is held there;
  - **Open**, with the account's name, when any session is held at that PC, however it was started;
  - "remote sign-in off", when the PC's policy blocks it;
- a row for each file share: name and host, and either **Open** (no access list) or a padlock with
  "Needs an account with access. It opens from that account's desktop." (4.5);
- a row for any other resource: name, kind icon, and its `observations` on click.

The view never shows account names, access lists, policies or contents. It refetches each time it
is opened and when the player returns to it from a sign-in screen, a desktop or a share. Closing a
desktop or a share that was opened from the view returns to the view, not to the world.

### 4.4 Remote sign-in and the remote desktop

**The remote lockable.** The first slice's sign-in screen and desktop take a "lockable": a sprite
with `scenarioData`. For a host row the client builds one: `{ scenarioData: { id, name, host,
type: "pc", sprite, lockType: "login", loginPicker: false, remote: { footholdId } } }`, with
`sprite` from the row (the PC's own picture, else `pc_desktop`). Every function that receives a
lockable with `remote` set behaves remotely:

- `openLoginSignIn` skips the `GET /login_accounts` request (that route stays physical, so account
  tiles and a written-down note are never served over the network) and opens the screen with no
  tiles;
- the sign-in request carries the foothold;
- the desktop's **Switch user** reopens the same remote screen over the desktop, and leaving it
  without a new sign-in returns to the desktop of the session still held;
- a desktop fetch that answers 403 `no_session` closes the desktop and returns to the network
  view; it never opens the physical sign-in screen;
- the desktop request carries the foothold (below).

**The screen.** No account tiles, whatever the PC's own picker says: tiles are something seen by
standing at a screen. The username and password are typed. A small **Captured sign-ins** list under
the fields offers the player's captures that are account passwords: choosing one fills the username
and, when the server has served it, the password. To know which captures those are, the
`GET /capture_secrets` answer gains a second map, `accounts: { targetId: username }`, holding only
entries the account-holder pass answered. A landing-page capture (a portal password, with an
address that is no account) is never offered, so the list cannot waste an attempt on a pair that
was never a sign-in. The list is a form filler: the gate is the server's password check (section 1).

**The server's answer** is the first slice's, with "PC reachable" replaced by "host reachable
through the foothold named" (section 5). The lockout counter is the one a local attempt uses, so
guessing remotely and at the keyboard share a budget, and a player who locks an account out from
the drop box has locked it for that member of staff too (slice 9.2 turns that into failed work,
13.2). A right password for an account the host's `access` does not admit still answers "This
account can't sign in on this PC".

**The desktop** is the same desktop: the host's own `contents`, the admitted profiles, and the
mapped shares (4.5), served by `GET /container/:id`. Its header adds a line, "Remote session
through <link name>". Open, Copy, Move, locked folders, Switch user and Sign out work as they do at
the keyboard.

**One session per PC, as before.** A remote sign-in fills the same `sessions[pcId]` slot a local one
would. The owner sitting at the desk does not block a remote session (the "is using this PC" rule
is about the physical screen, and the server cannot see it); it still blocks a click on the PC
itself.

**How a desktop request is judged.** The request says how the player is getting there, and the
server judges it on that alone:

- `GET /container/<pcId>?foothold=<id>`: the foothold is held and reaches the host, and the host's
  policy allows remote sign-in. The room and its doors are not consulted.
- `GET /container/<pcId>` with no foothold: the PC is physically reachable (today's rule) and is
  not headless. The network is not consulted. When a session that has a `foothold` is served this
  way, the server clears the session's `foothold`: the player is now sitting at it, and unplugging
  a device elsewhere no longer ends it.

Every other route that uses a session (the scoped folders, the inventory add from a desktop, an
unlock inside a desktop) asks what it asks today: that a session exists which admits the object.
A session exists only because the server checked a password or a claim, and an unplug deletes the
sessions it carried, so no further test is needed there in 9.3a.

**Reload.** Password sessions, remote or not, survive a reload as they do today. Footholds and
`gainedFootholds` are in the scenario response (section 6).

### 4.5 Shares

**The rule, written once** (`resource_admits_player?(resource)`): some **source** the player holds
reaches the resource, and the source is allowed.

- A source is a held foothold, or the PC of a session the player holds.
- It reaches the resource when it is on the resource's network (4.2).
- It is allowed when the share has no `access`, or when the source is a session whose identity the
  list admits. The check is a new helper, `resource_acl_admits?(resource, npc)`, in which a missing
  list admits everyone. `Game.acl_admits?` is not used here: it reads a missing list as "nobody".

So:

- **An open share** (no `access`) opens from the network view for a foothold on its network, and
  from the desktop of any session on a PC on its network, with or without a foothold. The lesson is
  the unauthenticated share.
- **A share with an access list** opens only from a desktop. When a desktop is composed for a
  session, local or remote, every `file_share` on the PC's network that the rule allows for that
  session is added after the profiles as a folder, "Ledger-Archive (\\HB-FS01\Ledger-Archive)".
  Opening the folder fetches the share's contents from `GET /container/<resourceId>`. A PC with no
  network maps no shares.
- One sign-in mechanic serves everything: accounts open desktops, desktops carry the shares the
  account may use, and the network decides which of them are there.
- Files in a share are taken with the first slice's Open, Copy and Move dialog and its `transfer`
  field. Locked folders inside a share work as they do inside a profile.

**How the server finds a share.** Exactly three lookups walk `resources`: `login_scope_of`,
`Game#find_scenario_object` and the controller's `find_object_in_scenario`. Each is reached only
after the scope check. The generic inventory search (`find_accessible_item`) and
`find_container_in_scenario` do **not** walk `resources`, as they do not walk profiles.

- `login_scope_of` returns a share's item with the scope `{ type: 'resource', id }` and the folders
  above it as the path. For the resource's own id it returns the resource record **with the same
  scope**, never with a nil scope. (A sign-in PC is returned with no scope and guarded by a special
  case; a share must not copy that pattern, or `POST /unlock` with `method: "unlocked"` would open
  it.)
- `session_admits?` gains the `resource` case: `resource_admits_player?`.
- **A refusal looks like an unknown id.** `GET /container`, `POST /unlock` and `POST /inventory`
  answer a resource, or anything inside one, that the rule refuses exactly as they answer an id
  that does not exist (404, the same body). A browser with no foothold and no session cannot tell
  that a share exists.

### 4.6 Determinism

Nothing in this slice rolls. Reach is a pure function of the scenario and the footholds held.

### 4.7 What the server establishes

| Fact | Established by | Strength |
|---|---|---|
| A plant | The server inventory holds an item whose scenario definition is a rogue device (3.3), the jack's room is unlocked or never locked, and the device is in no other jack | As strong as a keycard pickup (main plan 4.2). The server cannot see that the player walked to the jack |
| A remote sign-in | Password, lockout and `access` checked on the server, plus a held foothold on the host's network | As strong as a local sign-in |
| A headless host | The server refuses any sign-in there that names no held foothold on its network | The foothold cannot be skipped |
| Opening a share | The rule in 4.5, from server state only | As strong as the session or foothold behind it |
| A capture entry | Written by the browser | None. It fills a form (4.4) |

A chain built from these ends, at every step that matters, in a password the server compares or an
item the server holds.

## 5. Server routes (9.3a)

Every route 9.3a adds or changes, with its checks in the order they run. A failed check stops the
request. "Locked" means the route joins the `with_game_lock` list. Status codes follow the first
slice's (404 for an unknown target, 403 for one that cannot be reached, 422 for a refusal the
player caused).

**Shared checks.**

- *Object reachable*: the object is a room object, its room is unlocked or never locked, and every
  locked container above it is unlocked (`login_pc_reachable?`, generalised to any room object as
  `object_reachable?`).
- *Host reachable through a foothold*: the foothold id is in `footholds`; the target is a sign-in
  object with a network; that network is the foothold's.
- *Rogue device held*: a scenario item definition with `rogueDevice: true`, from any of the homes
  in 3.3, that `ItemIdentity.held_in?` finds in the server inventory. The flag is read from the
  definition, never from a field on the stored inventory entry.

| Route | Parameters | Checks, in order | Writes and answer |
|---|---|---|---|
| `POST /network/plant` (new, locked) | `jack_id`, optional `device_id` | 1. The jack exists: a room object with `networkJack: true` and a network. 2. Object reachable. 3. A foothold `jack_<id>` exists already: answer it again with `already: true` and write nothing. 4. Rogue device held (the one named by `device_id`, else the first) | Check 4 fails: 422, `reason: "no_device"`. Success: the device leaves the inventory and its room (4.1); `footholds[jack_<id>]` is written with the device's copy; the jack id joins `gainedFootholds`; the link item joins the inventory. Answer `{ success, foothold, inventory, first }`: `foothold` in the client shape of section 6, `first` true when the jack was not yet in `gainedFootholds` |
| `POST /network/unplug` (new, locked) | `jack_id` | 1. Foothold `jack_<id>` exists. 2. Object reachable (the jack) | The foothold and the link item go; the device's copy returns to the inventory; every session whose `foothold` is this one is deleted. Answer `{ success, inventory, endedPcIds }` |
| `GET /network` (new) | optional `foothold` | The game's own authorisation. An unknown foothold id answers 404 | `{ footholds: [...] }`: every held foothold (or the one named) with the view of section 6. A game with no footholds answers an empty list: nothing about any network |
| `POST /login` (changed, locked) | as today, plus optional `foothold` | **Without `foothold`:** as today, with one check added first: the PC is not headless (403 "PC not reachable", the answer for an unreachable PC). **With it:** 1. Host reachable through that foothold; otherwise 403 "PC not reachable". 2. The host's policy does not set `remote: "blocked"`; otherwise 422 "Remote sign-in is turned off on this PC", `remoteBlocked: true`, whatever was typed, and no failure counted. 3 to 5. The first slice's checks 2 to 4 unchanged (lockout, username and password, `access`), on the same per-PC, per-username counters | Success: `sessions[pcId] = { id, via: "password", foothold }`, `signedInPcs`; the answer adds `remote: true` and `footholdId`. Refusals as today |
| `POST /login` with any `claim` | as today | A claim that carries a `foothold`, or that targets a headless host, is refused with "Sign in required": an unlocked screen is a physical thing. This covers `claim: "owner"` today and any claim another slice adds (9.2's `guest`) | As today |
| `GET /login_accounts` (changed) | as today | As today, plus: a headless host answers 403 | As today |
| `GET /container/:id` (changed, locked) | as today, plus optional `foothold` | **A sign-in object:** 1. A session is held (403 `reason: "no_session"`). 2. With `foothold`: host reachable through it and remote sign-in not blocked. Without: physically reachable and not headless. Either failing: 403 `reason: "unreachable"`. **A resource, or an object inside one:** 1. `resource_admits_player?`; otherwise 404, as for an unknown id. 2. `path_unlocked?` for the folders above it and itself. **Anything else:** as today | A sign-in object: its `contents`, the admitted profiles, then a folder stub for each mapped share (4.5): `{ id: <resourceId>, type: "network_share", name, takeable: false, locked: false, hasContents: true }`. Served without `foothold`, a session's `foothold` is cleared (4.4). A resource: its `contents` through `filter_container_contents` |
| `POST /inventory` add (changed, locked) | as today, plus `source_resource_id` | First, for every add: the item is not a planted device (4.1). With `source_pc_id`: as today, and the search also covers the shares mapped for that PC's session. With `source_resource_id` (a share opened from the view): 1. `resource_admits_player?`; otherwise 404. 2. The item is in that resource's contents. 3. `path_unlocked?`. 4. Takeable. 5. Its `transfer` allows the choice. With neither: as today; the generic search does not walk `resources` | As today; a Copy records `copiedItems` |
| `POST /unlock` (changed, locked) | as today | Check 1 (the scope refusal) covers the `resource` scope through `session_admits?`, for the resource's own id as well as for what is inside it, and answers 404 as for an unknown id | As today |
| `POST /complete_task` (changed, locked) | as today | An `unlock_object` task whose target is a jack: its id is in `gainedFootholds` | As today |
| `GET /capture_secrets` (changed) | as today | As today | The answer gains `accounts: { targetId: username }` for the entries the account-holder pass answered (4.4). `secrets` is unchanged |
| `GET /scenario` (changed) | as today | As today | `filtered_scenario_for_bootstrap` deletes `networks`, `networkLinks` and `resources`. The action adds `footholds` (client shape, no hosts) and `gainedFootholds`; each `sessions` entry gains `remote` and `footholdId` |
| `GET /room/:id`, and the room data a door unlock returns (changed) | as today | As today | Section 6 |

`POST /logout` is unchanged.

## 6. What reaches the browser, and what never does

The rule: **the browser learns a network's name, and the names, hosts and contents of what the
network exposes, only from `GET /network` and `GET /container`, and only for a foothold or session
the server holds.** The withholding lives in the code that ships the data.

**What is not secret, and ships.** Ids and global names. A resource id or a network id can appear
in an event mapping's pattern (`network_viewed:office_lan`) or in a task, both of which reach the
browser, and that is accepted: an id names nothing the player can use. What the rule protects is
display names, host labels, `observations` and contents.

| Path | Sent | Withheld |
|---|---|---|
| Bootstrap, `GET /scenario` | `policies` (with `remote`), as today. `footholds`: `[{ id, via, name, itemId, sourceId, network: { id, name } }]` for footholds held. `gainedFootholds` | `networks`, `networkLinks` and `resources` are deleted, so no network name, resource name, host label or share content ships |
| Room data (`filtered_room_data`) | On a jack: `networkJack`, `jackConfirm`, `plantedSprite`, the hint fields, and `jackPlanted` (true when the server holds a foothold there). On a sign-in object: `host` and `headless` | `network` on every object and on the room; `linkName` and `linkStoreIn` (they arrive on the link item). A headless host gets no `loginAccounts` |
| `POST /network/plant` | The foothold in the bootstrap's shape, `first`, and the inventory with the link item | Hosts. The view is a separate request |
| `GET /network` | Per foothold: `{ id, via, name, network: { id, name }, hosts: [...] }`. A sign-in host: `{ id, kind: "pc", name, host, sprite, headless, remoteSignIn, session }`, `session` being `{ username, displayName, via, remote }` for any session held at that PC. A resource: `{ id, kind, name, host, open, observations? }` (`observations` only for a resource with no contents) | Every other network, entirely. Account names and tiles, `access` lists, policies' other fields, share contents |
| `GET /container/:id` | A desktop, with share stubs for mapped shares; a share's contents when the rule of 4.5 holds | Everything else: 403 for a sign-in object, 404 for a resource |
| `GET /capture_secrets` | `secrets` as today; `accounts`, the usernames of captures the server already answers | Unchanged otherwise |
| Events and globals | `<jackId>_planted`; event data as in 3.5 | Nothing server-side is read from them |

The names of rooms, objects and NPCs a host row shows ("Lena's PC") are the names room data would
show a player who walked in. They can name a room the player has not opened; that is the point of
looking at a network.

**No-exposure test.** A server test, beside the first slice's no-password test and run after every
step that changes what the server sends. The fixture has two networks, a jack on each, an open
share, a protected share with a locked folder in it, a sign-in PC in a locked room and a headless
host. It asserts:

- with no foothold and no session, no response from `/scenario`, `/room/:id`, a door `/unlock`,
  `/login_accounts`, `/capture_secrets` or `/network` contains a network's name, a resource's name,
  host label or `observations`, or a share item's name or text;
- with no foothold and no session, each of these answers exactly as it answers an invented id and
  carries no share string: `GET /container` on a resource id and on a folder in it; `POST /unlock`
  with `method: "unlocked"` and with a wrong PIN, on a resource id, on an unlocked item in it and on
  the locked folder; `POST /inventory` add of a share item with no source, with
  `source_resource_id` and with a `source_pc_id` that has no session;
- after a foothold on the first network, `/network` holds that network's names and no string from
  the second;
- a share's item text is only ever in a `/container` answer.

<!-- PART3 -->
