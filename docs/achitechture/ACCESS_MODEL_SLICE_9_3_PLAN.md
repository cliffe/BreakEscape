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
| Access lists | `Game.acl_admits?` answers false when the list is not a hash. Only `pc_admits_account?` reads a missing list as "everyone". Every NPC with creds also has the implicit role `staff` unless it says `"staff": false`, so a list naming `staff` admits every account holder | `game.rb` (`Game.identity_roles`, `:1149-1157`; `Game.acl_admits?`, `:1160-1168`) |
| The sign-in screen | `openLoginSignIn` first asks `GET /login_accounts` and, on a 403 or 404, shows "This PC can't be reached" and returns. The desktop's Switch user button and the desktop's 403 fallback both call it | `unlock-system.js`, `container-minigame.js` |
| Captures | `se_captures` is written by the client and synced. `GET /capture_secrets` answers nothing at all unless `social.captures.revealSecret` is true; under it, it serves an account holder's password for an entry whose `address` is that account's username (the account-holder pass, `account_capture_passwords`), and a landing-page secret by address, with a single-secret fallback that counts landing pages only. A landing-page capture's address is not an account username | `Game#capture_secrets_for_client` (`game.rb:907-952`), `#account_capture_passwords` (`:957-969`) |
| Remote session (lab) | A declared grant: a timer's `give_item` hands the player a `pc` item, "Remote Session: LW-FIN-07", whose text files are hand-written. Nothing in it is connected to an account, a PC or a share | `lib/break_escape/declared_grants.rb`, `Game#held_grant_items` |
| Drop box (lab, as in this repository) | `network_port` is a `pc` object with `requiresItem: "kit_dropbox"` and a `confirm_action` that sets the global `kp_netdrop_planted`. The box stays in the inventory. A second object, `network_port_planted`, is revealed by the global. A mapping on Ruth adds a "foothold" capture and completes `opt_netdrop` | `scenarios/lab_physical_pentest/scenario.json.erb`, room `P3` |
| Bootstrap | `filtered_scenario_for_bootstrap` deep-copies the whole scenario and deletes what must not ship. Rooms are reduced to a whitelist of fields. **Any new top-level key ships as authored unless this method deletes it** | `game.rb` |
| Globals | Written by the client and merged by `PUT /sync_state` every 30 seconds and on page hide. The server sets one kind itself: when it completes a task (`POST /complete_task`, after the task type's own check), `apply_task_set_globals!` writes the task's `onComplete.setGlobal` values for globals the scenario declares in `globalVariables`. A global set that way follows a check the server made. Slice 9.2 plans a second case | `Game#merge_global_variables!`, `state-sync.js`; `Game#complete_task!` (`game.rb:2462`), `#process_task_completion` and `#apply_task_set_globals!` (`:3736-3780`) |
| Positions | The server cannot see where the player stands. "Reachable" on the server means "the room is unlocked or never locked" | main plan 4.2 |
| Inventory | An add is validated and the server stores its own copy of the item. The add for a room item checks that the room is open and the item takeable; it does not ask whether the item was taken before. A remove is not checked. Room data hides a taken item through `objects_removed`, with "it is in the inventory" as the fallback | `games_controller.rb` `inventory`, `find_accessible_item`; `Game#apply_room_state_changes!` |
| Inventory on the client | Items in `playerInventory` are restored on load without a request, through `createInventorySprite` (not exported) and a private `_restoredFromSave` flag | `systems/inventory.js` |
| Prompts | `window.gameConfirm(message, confirmLabel, cancelLabel)` has two buttons whose labels the caller sets, and resolves true or false. Esc and the close cross answer false, the same as the second button, so a prompt can carry one action and "do nothing", never two actions | `systems/notifications.js:264-291` |
| A click on an object | Order in `handleObjectInteraction`: a sign-in PC's own branch, then the workstation call, then `triggerOnInteract` with `requiresItem`, then drops, consumables and the generic flow | `systems/interactions.js` (sign-in branch `:794-801`) |
| Minigame scenes | Registered with `MinigameFramework.registerScene` in `minigames/index.js`. `systems/minigame-registry.js` is a different table: object type to starter function. Each minigame's stylesheet is a `<link>` in the game page | both files; `app/views/break_escape/games/show.html.erb:25-62`, files in `public/break_escape/css/` |
| Leaving a minigame | One minigame runs at a time: starting one ends the one that is open, without calling its own `complete` (`minigame-manager.js:57-80`). The framework's `returnTo` parameter reopens a parent only on a normal exit (`:280-287`, `:319-320`). The desktop's Close button, the frame's close cross and Esc all call `complete(false)` (`container-minigame.js:552-555`; `base-minigame.js:38-45`, `:73-80`). Opening a file or folder from a desktop stores `window.pendingContainerReturn`, closes the desktop and hands a stand-in sprite to `handleObjectInteraction` (`container-minigame.js:725-757`, `:772-802`); the notes reader then reopens the desktop (`returnToContainerAfterNotes`, `:1087`), but the text-file reader's cleanup clears the record (`text-file-minigame.js:368-378`), so a text file read from a desktop closes to the world. The sign-in screen's `onComplete` opens the desktop only when a session is held (`unlock-system.js:314-319`). `pc-sessions.js` closes an open desktop through the callback the desktop registered, with a message and no reason (`pc-sessions.js:328-339`) | the files named |
| Refusals of an unknown id | `GET /container` answers 404 "Container not found" (`games_controller.rb:551`). `POST /unlock` answers 422 `{ success: false, message: "Invalid attempt" }` for an object it cannot find, as for a wrong attempt (`:897-913`; `Game#validate_unlock`, `game.rb:2097`). `POST /inventory` add answers 422 "Item not found in scenario: <type>" (`games_controller.rb:1010-1017`, `:2022-2025`) | `games_controller.rb` |
| Authorisation and routes | Every action calls `authorize @game`; Pundit raises for an action whose policy method is missing, and `game_policy.rb` has one method per action (`container?`, `login?`, `capture_secrets?`, `:53-99`). In the routes' member block a nested path names its action with `to:` (`config/routes.rb:46-49`) | `app/policies/break_escape/game_policy.rb`, `config/routes.rb` |

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
| `network_view_closed` (foothold id) | `{ footholdId, reason }` | The player has left the network screens (4.3, "Getting back"): `reason` is `closed` (the player closed the last screen), `link_dropped` (an unplug) or `foothold_gone` (the foothold was not held when the view refetched) |
| `network_share_opened` (resource id) | `{ resourceId, via, pcId }` | A share's contents loaded; `via` is `foothold` (from the view) or `session` (a mapped share on a desktop) |
| `pc_signed_in`, `pc_signed_out` | gain `remote` (true when the sign-in went through a foothold) and `footholdId` | As in the main plan 5.3 |
| `pc_signin_failed` | `reason` gains `remote_blocked` | A remote sign-in at a PC whose policy blocks it |

- One global the client publishes, as the workstation layer publishes `<id>_screen_locked`:
  `<jackId>_planted`, for `observationVariants`, hint variants and `revealOnGlobal`. A scenario that
  reads it declares it in `globalVariables`, as scenarios do for the workstation globals. It is
  display state only; the server never reads it.
- An objective that must not be skippable is an `unlock_object` task on the jack or the host, not
  a task completed by a mapping: the server completes it only after its own check
  (`gainedFootholds` for a jack, `signedInPcs` for a sign-in host). A global that ink or a debrief
  reads for the same step goes in that task's `onComplete.setGlobal`, which the server writes when
  it completes the task (section 2, "Globals"), so the global follows the check rather than a
  client event. A browser can still write any global through `PUT /sync_state`; the task, which
  is what objectives and the score count, cannot be written that way. The lab does this (10.2).

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
  `footholds.*.device`. `POST /inventory` add refuses such an item ("already in use"),
  `apply_room_state_changes!` hides it from room data, beside the existing "it is in the inventory"
  rule, and `filter_container_contents` drops it from a container's listing beside the items the
  inventory holds (`games_controller.rb:1885-1911`), so a device whose home is a crate is not
  shown in the crate while it is planted. So a lost `objects_removed` write, or a hand-made add
  request, cannot bring the box back while it is in the wall, and no home offers a second box.
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

1. A device is planted here: `window.gameConfirm("Your <device name> is plugged in here. Open it
   from your inventory.", "Unplug it", "Leave it")`. "Unplug it" unplugs; "Leave it", Esc and the
   close cross do nothing. A player who clicked the box to use it is told where it is used from,
   and nothing is lost by a misclick.
2. No rogue device is held: the jack's resolved `requiresItemHint`, as an item plant refuses today;
   for a jack that sets none, "You have nothing to plug into this port."
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
- `NetworkModel.reach_conditions(data, station_network, resource)` is the function slice 9.2 calls
  to compose an NPC's work plan (13.2). It takes the scenario data first, as every other function
  in the module does, because 9.3b's answer needs the links and each network's `downIf`; 9.3a
  does not read it. In 9.3a it answers `[[]]` (one route with no conditions) when
  the resource has no `network` or is on the station's network, and `[]` (no route) otherwise.
  9.3b extends the same answer with links and outages.

### 4.3 The network view

Clicking a link item opens a new minigame scene, `network-view`, in the desktop window chrome the
container minigame uses. It shows what `GET /network` answers for that foothold and nothing else:

- a header: the link's name and its network ("Drop box: comms room, on Harbour office LAN");
- a row for each sign-in host: host label, name, and one action, decided in this order:
  1. "remote sign-in off", when the PC's policy blocks it, whatever sessions are held there (the
     row offers nothing and carries no session);
  2. **Open**, with the account's name, when a password session is held at that PC, local or
     remote;
  3. **Sign in** otherwise. A claimed session (the owner's unlocked screen, `via: "claim"`) is a
     physical thing and is not offered over the network: its row shows **Sign in**, and a remote
     sign-in there replaces it as a sign-in at the keyboard would;
- a row for each file share: name and host, and either **Open** (no access list) or a padlock with
  "Needs an account with access. It opens from that account's desktop." (4.5);
- a row for any other resource: name, kind icon, and its `observations` on click.

The view never shows account names, access lists, policies or contents. It refetches each time it
is opened, including every time the player comes back to it. Rows carry stable attributes for
tests and scripted runs: `data-host-id` on a host row, `data-resource-id` on a resource row, and
`data-action` (`sign-in`, `open`, `observe`) on the control that acts.

#### Getting back

A player who goes from the view to a sign-in screen, a desktop, a file and back must never be
dropped into the world mid-chain. The framework's own `returnTo` cannot do this: it reopens a
parent only on a normal exit, and every close the player makes is a failure exit (section 2,
"Leaving a minigame"). So `network-links.js` owns the way back, and no network screen passes
`returnTo` or `suspended` to `MinigameFramework`.

- **The trip.** `network-links.js` keeps one record, the trip: the foothold id the player is
  working through, whether the trip began at the view or at a session, and an optional
  `returnTo`. It is started by `open(footholdId, { returnTo })` (the view) or
  `openSession(pcId, { returnTo })` (a held remote session's desktop, opened directly). Both
  replace any trip already running. `returnTo` is a function taking `{ reason }`; it belongs to
  `network-links.js` and is never handed to the framework. It is called once, when the trip ends,
  after the landing below, and only if no minigame is open by then. The capture log passes one
  that reopens itself (13.4).
- **Two calls run the table.** `resume(message)` reopens the trip's view, with an optional one-line
  message, and refetches. `leave(reason)` ends the trip: it forgets the record, emits
  `network_view_closed` with the reason, then calls `returnTo`. Both wait one tick and do nothing
  if a minigame has opened in the meantime (a reader, the sign-in screen), so a screen that has
  handed over to another is never covered by the view.
- **Every network screen says why it closed.** The view, a remote desktop, a share opened from
  the view and the remote sign-in screen each record an exit reason and, from their cleanup, call
  `window.networkLinks.landed(screen, reason)`, which looks the pair up in the table. The reason
  is `close` unless the path that closes the screen set another first: `handover` (the view
  opened a host or a share), `switch` (Switch user), `item` (a file or folder handed to a reader,
  the three paths in `container-minigame.js` that set `pendingContainerReturn` or call
  `openFileInPlace`), `share` (a mapped share opened from a desktop), `no_session` or
  `unreachable` (a 403 on the desktop fetch), and the session-end reasons `pc-sessions.js` passes
  (`sign_out`, `link_dropped`, `displaced`). `pc-sessions.js` passes that reason as a second
  argument to the desktop's registered close callback; today it passes only a message.

| Leaving | Lands on |
|---|---|
| The view, by its Close, the close cross or Esc | The world: `leave("closed")` |
| The view, handing over to a host or a share | The screen it opened |
| The remote sign-in screen, closed with no session at that PC | The view (`resume`) |
| The remote sign-in screen, signed in | The desktop |
| Switch user on a remote desktop, left with no new sign-in | The desktop of the session still held |
| A remote desktop, by its Close, the close cross or Esc | The view, when the trip began at the view; when it began at `openSession`, `leave("closed")` |
| A file or folder opened from a remote desktop | The reader. When the reader closes, the desktop reopens: the notes reader already does this, and the text-file reader's cleanup, when the stored `pendingContainerReturn` is a network screen (its lockable has `remote`, or it is a share opened from the view), reopens it through `startContainerMinigame` instead of clearing the record |
| A mapped share opened from a desktop, by its Close | The desktop it was opened from |
| Sign out on a remote desktop | The view |
| A 403 `no_session` on a remote desktop | The view, with "Your session on <host> has ended." The client drops its copy of the session |
| A 403 `unreachable` on a remote desktop | The view, with "<host> can't be reached over this link." The client keeps its copy of the session; the server still holds it |
| A session displaced by an NPC (slice 9.2) | The view, where the row is back to **Sign in** |
| "The link dropped" (an unplug ends the session) | The world: `leave("link_dropped")` |
| A share opened from the view, by its Close | The view |
| A file opened from a share that was opened from the view | The reader, then the share, by the same text-file rule |
| The view refetches and the foothold is no longer held | The world: `leave("foothold_gone")`, with "The link is gone." |

The world is reached through `leave` only, so `network_view_closed` fires exactly once per trip,
and never when the view hands over to a host or a share. Nothing else in this slice listens for a
minigame's close.

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
- a desktop fetch that answers 403 closes the desktop and returns to the network view, never to
  the physical sign-in screen: with `no_session` the client drops its copy of the session; with
  `unreachable` it keeps it (4.3, "Getting back");
- the desktop request carries the foothold (below).

**The screen.** No account tiles, whatever the PC's own picker says: tiles are something seen by
standing at a screen. The username and password are typed. A small **Captured sign-ins** list under
the fields offers the player's captures that are account passwords: choosing one fills the username
and, when the server has served it, the password. To know which captures those are, the
`GET /capture_secrets` answer gains a second map, `accounts: { targetId: username }`. An entry is
in it when its `address`, normalised as usernames are, is a username that the account-holder
pass would answer (a key of `account_capture_passwords`, with whatever conditions that method
applies, including the engine feedback plan's capture proofs once they are built). It is
computed apart from `secrets`: whatever `revealSecret` says, and never from the landing-page or
single-secret passes. It carries only the address the browser itself wrote, so it reveals no
secret; when `revealSecret` is off it still lets the list fill the username, and `secrets` then
fills no password. A landing-page capture (a portal password, with an
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
itself. So a player signed in at a PC at its keyboard who signs in there again from the view now
holds a remote session in that one slot: unplugging the device ends it, and the PC then asks for
a password at the keyboard too. That is accepted and tested (step 4). A claimed session is never
served over the network: a desktop request that names a foothold for a PC whose session is
`via: "claim"` answers 403 `unreachable` (the client keeps its copy of the claim, which still
opens at the keyboard).

**How a desktop request is judged.** The request says how the player is getting there, and the
server judges it on that alone:

- `GET /container/<pcId>?foothold=<id>`: the foothold is held and reaches the host, the host's
  policy allows remote sign-in, and the session there is not a claim. The room and its doors are
  not consulted.
- `GET /container/<pcId>` with no foothold: the PC is physically reachable (today's rule) and is
  not headless. The network is not consulted. When a session that has a `foothold` is served this
  way, the server clears the session's `foothold`: the player is now sitting at it, and unplugging
  a device elsewhere no longer ends it.

Every other route that uses a session (the scoped folders, the inventory add from a desktop, an
unlock inside a desktop) asks what it asks today: that a session exists which admits the object.
A session exists only because the server checked a password or a claim, and an unplug deletes the
sessions it carried, so no further test is needed there in 9.3a.

**What the client knows of a session.** The sign-in answer and each `sessions` entry of
`GET /scenario` (both built by `login_session_answer`) gain `remote` (true when the session has a
`foothold`), `footholdId`, and for a remote session `host` (the PC's `host`, else its `name`).
The PC's room may never have loaded, so the label comes with the session. `pcSessions.list()`
entries carry the three fields, so a list of sessions (the capture log's, 13.4) can name a remote
host without room data. `host` is not secret (3.2), and it reaches only a browser that holds the
session.

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
- **How a share opens on the client.** A share is never opened through `handleObjectInteraction`
  or `POST /unlock`: left to that path, a click on an unlocked container would send
  `method: "unlocked"`, which the server accepts for an admitted share and records in
  `unlockedObjects` (`game.rb:2097-2106`, `games_controller.rb:934-949`). A share row in the view,
  and a `network_share` stub on a desktop, each start the container minigame directly, which
  fetches the contents from `GET /container/<resourceId>`. Everything taken from a share opened in
  the view carries `sourceResourceId`; from a mapped share, the desktop's `sourcePcId`.
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
  answer a resource, or anything inside one, that the rule refuses exactly as each answers an id
  that does not exist on that route: `GET /container` 404 "Container not found: <id>";
  `POST /unlock` 422 `{ success: false, message: "Invalid attempt" }` with no `feedback`,
  `caseMismatch` or `reason`; `POST /inventory` add 422 "Item not found in scenario: <type>"
  (section 2, "Refusals of an unknown id"). A browser with no foothold and no session cannot tell
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
player caused), except where a refusal must look like an unknown id: then it is whatever that
route answers for an invented id (4.5).

The three new routes sit in the routes' member block with named actions, and each has a policy
method that answers as `show?` does (`network?`, `network_plant?`, `network_unplug?` in
`app/policies/break_escape/game_policy.rb`); without them `authorize @game` raises on every
request:

```ruby
get  'network',         to: 'games#network',         as: 'network'
post 'network/plant',   to: 'games#network_plant',   as: 'network_plant'
post 'network/unplug',  to: 'games#network_unplug',  as: 'network_unplug'
```

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
| `POST /network/plant` (new, locked) | `jack_id`, optional `device_id` | 1. The jack exists: a room object with `networkJack: true` and a network; otherwise 404 `{ success: false, error: "Jack not found" }`. 2. Object reachable; otherwise 403 `reason: "unreachable"`. 3. A foothold `jack_<id>` exists already: answer it again with `already: true` and write nothing. 4. Rogue device held: with `device_id`, that device must be held, with no fallback to another; without it, the first held in scenario order | Check 4 fails: 422, `reason: "no_device"`. Success: the device leaves the inventory and its room (4.1); `footholds[jack_<id>]` is written with the device's copy; the jack id joins `gainedFootholds`; the link item joins the inventory. Answer `{ success, foothold, inventory, first }`: `foothold` in the client shape of section 6, `first` true when the jack was not yet in `gainedFootholds` |
| `POST /network/unplug` (new, locked) | `jack_id` | 1. The jack exists (404 as for a plant). 2. Foothold `jack_<id>` exists; otherwise 422 `reason: "not_planted"`. 3. Object reachable (the jack); otherwise 403 `reason: "unreachable"` | The foothold and the link item go; the device's copy returns to the inventory; every session whose `foothold` is this one is deleted. Answer `{ success, inventory, endedPcIds }` |
| `GET /network` (new) | optional `foothold` | The game's own authorisation. An unknown foothold id answers 404 | `{ footholds: [...] }`: every held foothold (or the one named) with the view of section 6. A game with no footholds answers an empty list: nothing about any network |
| `POST /login` (changed, locked) | as today, plus optional `foothold` | **Without `foothold`:** as today, with one check added first: the PC is not headless (403 "PC not reachable", the answer for an unreachable PC). **With it:** 1. Host reachable through that foothold; otherwise 403 "PC not reachable". 2. The host's policy does not set `remote: "blocked"`; otherwise 422 "Remote sign-in is turned off on this PC", `remoteBlocked: true`, whatever was typed, and no failure counted. 3 to 5. The first slice's checks 2 to 4 unchanged (lockout, username and password, `access`), on the same per-PC, per-username counters | Success: `sessions[pcId] = { id, via: "password", foothold }`, `signedInPcs`; the answer adds `remote: true`, `footholdId` and `host`. Refusals as today |
| `POST /login` with any `claim` | as today | A claim that carries a `foothold`, or that targets a headless host, is refused with "Sign in required": an unlocked screen is a physical thing. This covers `claim: "owner"` today and any claim another slice adds (9.2's `guest`) | As today |
| `GET /login_accounts` (changed) | as today | As today, plus: a headless host answers 403 | As today |
| `GET /container/:id` (changed, locked) | as today, plus optional `foothold` | **A sign-in object:** 1. A session is held (403 `reason: "no_session"`). 2. With `foothold`: host reachable through it, remote sign-in not blocked, and the session is not a claim. Without: physically reachable and not headless. Either failing: 403 `reason: "unreachable"`. **A resource, or an object inside one:** 1. `resource_admits_player?`; otherwise 404 "Container not found: <id>", the answer for an invented id. 2. `path_unlocked?` for the folders above it and itself (403, as for a locked folder in a profile). **Anything else:** as today | A sign-in object: its `contents`, the admitted profiles, then a folder stub for each mapped share (4.5): `{ id: <resourceId>, type: "network_share", name, takeable: false, locked: false, hasContents: true }`. Served without `foothold`, a session's `foothold` is cleared (4.4): this action now writes `player_state`, and the comment above it that calls it read-only and a candidate to drop the lock (`games_controller.rb:515-525`) is rewritten to say it writes and must stay locked. A resource: its `contents` through `filter_container_contents` |
| `POST /inventory` add (changed, locked) | as today, plus `source_resource_id` | First, for every add: the item is not a planted device (4.1). With `source_pc_id`: as today, and the search also covers the shares mapped for that PC's session. With `source_resource_id` (a share opened from the view): 1. `resource_admits_player?`; otherwise 422 "Item not found in scenario: <type>", the answer for an invented item. 2. The item is in that resource's contents. 3. `path_unlocked?`. 4. Takeable. 5. Its `transfer` allows the choice. With neither: as today; the generic search does not walk `resources`. The "already held, no source named" shortcut (`games_controller.rb:1009`) also requires no `source_resource_id` | As today; a Copy records `copiedItems` for a `source_resource_id` add as for a `source_pc_id` one (`:1030`) |
| `POST /unlock` (changed, locked) | as today | Check 1 (the scope refusal) covers the `resource` scope through `session_admits?`, for the resource's own id as well as for what is inside it, and answers 422 `{ success: false, message: "Invalid attempt" }` with no `feedback`, `caseMismatch` or `reason`, the answer for an invented id | As today |
| `POST /complete_task` (changed, locked) | as today | An `unlock_object` task whose target is a jack: its id is in `gainedFootholds` | As today |
| `GET /capture_secrets` (changed) | as today | As today | The answer gains `accounts: { targetId: username }`, composed as 4.4 says (the account-holder test, whatever `revealSecret` says, never the fallback). `secrets` is unchanged |
| `GET /scenario` (changed) | as today | As today | `filtered_scenario_for_bootstrap` deletes `networks`, `networkLinks` and `resources`. The action adds `footholds` (client shape, no hosts) and `gainedFootholds`; each `sessions` entry gains `remote`, `footholdId` and, for a remote session, `host` (4.4) |
| `GET /room/:id`, and the room data a door unlock returns (changed) | as today | As today | Section 6 |

`POST /logout` is unchanged.

## 6. What reaches the browser, and what never does

The rule: **the browser learns a network's name, and the names, hosts and contents of what the
network exposes, only from `GET /network` and `GET /container`, and only for a foothold or session
the server holds.** The withholding lives in the code that ships the data.

**What is not secret, and ships.** Ids and global names. A resource id or a network id can appear
in an event mapping's pattern (`network_viewed:office_lan`) or in a task, both of which reach the
browser, and that is accepted: an id names nothing the player can use. What the rule protects is
display names, a resource's `host`, `observations` and contents. (A sign-in PC's `host` is not
protected: it ships in room data, 3.2.)

| Path | Sent | Withheld |
|---|---|---|
| Bootstrap, `GET /scenario` | `policies` (with `remote`), as today. `footholds`: `[{ id, via, name, itemId, sourceId, network: { id, name } }]` for footholds held. `gainedFootholds` | `networks`, `networkLinks` and `resources` are deleted, so no network name, resource name, resource `host` or share content ships |
| Room data (`filtered_room_data`) | On a jack: `networkJack`, `jackConfirm`, `plantedSprite`, the hint fields, and `jackPlanted` (true when the server holds a foothold there). On a sign-in object: `host` and `headless` | `network` on every object and on the room; `linkName` and `linkStoreIn` (they arrive on the link item). A headless host gets no `loginAccounts` |
| `POST /network/plant` | The foothold in the bootstrap's shape, `first`, and the inventory with the link item | Hosts. The view is a separate request |
| `GET /network` | Per foothold: `{ id, via, name, network: { id, name }, hosts: [...] }`. A sign-in host: `{ id, kind: "pc", name, host, sprite, headless, remoteSignIn, session }`, `session` being `{ username, displayName, via, remote }` for a password session held at that PC, and absent for a claimed session and whenever `remoteSignIn` is false (4.3). A resource: `{ id, kind, name, host, open, observations? }` (`observations` only for a resource with no contents) | Every other network, entirely. Account names and tiles, `access` lists, policies' other fields, share contents |
| `GET /container/:id` | A desktop, with share stubs for mapped shares; a share's contents when the rule of 4.5 holds | Everything else: 403 for a sign-in object; for a resource or anything in one, the 404 an invented id gets |
| `GET /capture_secrets` | `secrets` as today; `accounts`, the usernames the browser wrote on captures of account holders (4.4) | Unchanged otherwise |
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
  `host` or `observations`, or a share item's name or text;
- with no foothold and no session, each of these answers with the same status and body as the
  same route gives an invented id (404 for `GET /container`, 422 for `POST /unlock` and
  `POST /inventory`, section 2) and carries no share string: `GET /container` on a resource id and on a folder in it; `POST /unlock`
  with `method: "unlocked"` and with a wrong PIN, on a resource id, on an unlocked item in it and on
  the locked folder; `POST /inventory` add of a share item with no source, with
  `source_resource_id` and with a `source_pc_id` that has no session;
- after a foothold on the first network, `/network` holds that network's names and no string from
  the second;
- a share's item text is only ever in a `/container` answer.

## 7. Validator, schema and dungeon graph (9.3a)

### 7.1 Schema (`scripts/scenario-schema.json`)

- Top level: `networks` (map of `{ name }`, plus the reserved `downIf` and `wifi: { ssid, psk }`),
  `networkLinks` (reserved: a list of two-item lists of strings), `resources` (map;
  `additionalProperties` left open, because slice 9.2 owns other fields on the same entries).
- Rooms: `network`.
- Objects: `network`, `host`, `headless`, `networkJack`, `jackConfirm`, `plantedSprite`,
  `linkName`, `linkStoreIn`, `rogueDevice`, and the reserved `wifiAp`, `portSecurity`,
  `portSecurityMessage`.
- Policies: `remote`, enum `allowed`, `blocked`.

### 7.2 Validator

The checks live in a new file, `scripts/validate_network.rb` (one function,
`check_network_model(json_data)`, required and called by `scripts/validate_scenario.rb` beside
`check_access_model`, the way `validate_social.rb` and `validate_npc_needs.rb` are separate files).
They read their rules from `BreakEscape::NetworkModel` so they match the server. In
`validate_scenario.rb` itself this slice adds only the `require`, the call, and the new names in
the known-field lists.

Errors:

- a `network` (on a room, an object or a resource) that names no entry in `networks`;
- a jack with no network of its own or from its room;
- `networkJack` on a sign-in object, on an object with `triggerOnInteract`, `requiresItem`,
  `locked` or a `lockType`, or on an object inside a container or a profile;
- `rogueDevice` on an item with no `id`, or that is not takeable, or that is `droppable` (a player
  drop writes the item into the room and leaves it in the server's inventory,
  `Game#add_item_to_room!`, `game.rb:427-443`, so it could be in a room and in a jack at once);
- a `rogueDevice` item named by an object that has both `requiresItem` and `consumesItem` (the
  device would be used up and the jack could never be reached);
- `networkJack` on a takeable object;
- `headless` on an object that is not `lockType: "login"`, or that has no network, or that is a
  workstation with an owner (`screenOwner`, or an NPC's `needsHome`);
- `contents` on a resource whose `kind` is not `file_share`;
- a resource id, or the id of an item in a resource's contents, equal to the **id or the name** of
  a room object, a profile item or another resource (`login_scope_of` matches on both and searches
  rooms first, so either would shadow the share);
- a resource `access` naming a person that is no NPC (the existing ACL reference check, with
  `resources/<id>/access` added to its sources);
- a policy `remote` that is neither `allowed` nor `blocked`;
- an account password (`creds.password`) in a network's `name` or in a resource's `name`, `host` or
  `observations`: those strings go to every foothold's view. A clue belongs in the text of an item;
- any field reserved for 9.3b (3.1), with the message "needs slice 9.3b".

Warnings:

- **Doors skipped.** A sign-in PC that is not headless, sits in a locked room, is on a network
  with a jack outside that room, and whose effective policy does not write `remote` out. Remote
  sign-in is on by default, and a room's default `network` can put every PC in the room on the
  network without the author looking at each one, so the author acknowledges the route by writing
  `"remote": "allowed"` in the PC's policy, or closes it with `"blocked"`. A headless host needs no
  acknowledgement: being reached over the network is what the field says;
- a jack in a scenario with no `rogueDevice` item, and a `rogueDevice` item in a scenario with no
  jack;
- a `file_share` with an access list that no sign-in object on its network can map (no desktop can
  ever show it), that no account is admitted to, or whose admitted accounts can sign in at no
  object on its network;
- two sign-in objects with the same `host` label (several resources on one host are fine: a
  server hosts several shares);
- a sign-in host whose `contents` (or a folder in them) hold a physical item, such as a key, a
  keycard or a lockpick: over the network it would be taken down the wire;
- a host that can be signed in to only remotely (headless, or in a room the dungeon graph shows no
  way into) under a policy with `maxAttempts`: a lockout lasts the mission and there is no keyboard
  to fall back on.

Information lines, printed with the identity reach the first slice prints:

- **Network reach.** For each jack, its network and the sign-in hosts and resources listed on it.
- **Reachable without a foothold.** Each share with an access list that maps on the desktop of a
  PC the player can walk up to (not headless), with the accounts admitted; and each sign-in host
  that is not headless and not in a locked room. Roles are compared as the server compares them,
  so the implicit `staff` role of every account holder counts (`Game.identity_roles`): a share
  for `finance` maps on a `staff` PC in an open room for any finance account. If a chain is meant
  to need the foothold, its payoff should not be on this list.
- A network with hosts or resources and no jack (it may exist only for 9.2's NPC work).

Tests: `test/js/validator-network-model.test.mjs` (new, in the pattern of
`validator-access-model.test.mjs`): one fixture per error and warning, a clean fixture that raises
none, and a fixture whose information lines are compared.

### 7.3 Dungeon graph (`scripts/generate_dungeon_graph.rb`)

- A jack is a lock-like node that the rogue device item opens; it has an edge to its network's
  node.
- A network node has an "exposes" edge to each sign-in host and each resource on it. A headless
  host has no other way in, so the network edge is its only incoming route besides the account.
- The first slice's account nodes already point at the PCs they sign in to; a share with an access
  list gets an edge from each admitted account's sign-in node, and an open share from the network.

Tests: `test/js/dungeon-graph-networks.test.mjs` (new, beside
`dungeon-graph-identities.test.mjs`): the device opens the jack and the jack reaches its network;
a headless host is reached only through the network and an admitted account; a protected share has
an edge from each admitted account and none from the network alone.

## 8. Saved games and reset

- **Games created before this slice.** Their `scenario_data` snapshot has no `networks`, so every
  new route answers 404 or an empty list and nothing else changes. Their `player_state` has no
  `footholds` key: every reader defaults it, as `access_sessions` does for `sessions`.
- **A scenario that adopts networks later** (the lab, section 10) changes only games created after
  the edit: a game in progress keeps its snapshot.
- **Reload.** `footholds`, `gainedFootholds` and every password session are kept. The link items
  are ordinary inventory entries and come back in `playerInventory`. On load, before any room
  loads, `network-links.js` sets `<jackId>_planted` from the scenario response: true for the
  source of every held foothold, false for every other id in `gainedFootholds`. So a saved global
  left true by an unplug whose sync was lost is corrected at once, and variants and
  `revealOnGlobal` in other rooms never show a box that is not there. `jackPlanted` in room data
  then restores the jack's own look when its room loads. The server's answer always wins over
  the saved global.
- **Reset.** Neither new key is preserved, the inventory is rebuilt from the start items and
  `room_states` is cleared, so a planted device is back where the scenario put it and there is no
  link item.
- **A session's `foothold`** is an extra key on an existing record. Code that reads `id` and `via`
  is unaffected, and `end_claimed_sessions!` still ends only `via: "claim"`.

## 9. Build steps (9.3a)

Build in this order. Each step is testable before the next and its tests are part of the step. The
testing approach is the first slice's (main plan, section 8, "How the slice is tested"): unit tests
in every step; one feature scenario built for testing, `test_access_networks`; scripted regression
runs of it through the `window.__test` bridge with the two checks after every beat (what reached the
browser, what the server recorded); the first slice's three suite runs again wherever a step
touches sign-in; `lab_physical_pentest` last. Model tiers for the runs are the ones `AGENTS.md`
assigns to scripted regression runs and to persona runs. All browser runs use the keyless server on
:3001; nothing in this plan touches the server on :3000. No step runs a database task.

A step is done when its unit tests, the node suite (`bin/test-js`), the Rails suite
(`bin/rails test`), the no-password test, the no-exposure test and every suite run built so far
pass, and, for a step that changes client code (7 and 8), the phone reopen check
(`node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`), as
`AGENTS.md` requires of every engine change.

### Step 1. Shared rules and state

Files:
- `lib/break_escape/network_model.rb` (new): `networks(data)`, `network_of(object, room)`,
  `jacks(data)`, `sign_in_objects_on(network_id, data)`, `resources_on(network_id, data)`,
  `rogue_device_definitions(data)` (every home in 3.3), and `reach_conditions(data,
  station_network, resource)` (4.2). Plain Ruby, no ActiveSupport.
- `app/models/break_escape/network_access.rb` (new): a concern included in `Game`, as `CarryOver`
  and `ScoreBreakdown` are. All of this slice's model code lives here, so `game.rb` takes only
  small hooks.
- `app/models/break_escape/game.rb`: `include NetworkAccess`; the two keys in
  `ACCESS_STATE_DEFAULTS`; `stamp_scenario_object_ids!` also walks `resources.*.contents`
  (`<resourceId>_content_<n>`).
- `test/support/network_model_scenario.rb` (new): the fixture the server tests share (section 6's
  no-exposure fixture, with three accounts, a PC in an open room and one under a
  `remote: "blocked"` policy).

Tests: `test/unit/network_model_test.rb` (new): membership from the object, from the room, and
neither; the hosts and resources on a network in scenario order; a rogue device definition found
in each of the five homes; `reach_conditions` for a resource on the same network, on another, and
with no network; ids stamped once, and a second run changes nothing; a scenario with no `networks`
returns empty answers everywhere.

### Step 2. Server withholding

Before any scenario is authored with a network.

Files:
- `game.rb`: `filtered_scenario_for_bootstrap` deletes `networks`, `networkLinks` and `resources`;
  `filter_requires_and_contents_recursive` deletes `network`, `linkName` and `linkStoreIn` from
  every object; `filtered_room_data` deletes the room's `network` and calls
  `attach_network_state!` (in the concern), which sets `jackPlanted` on jacks.
  `attach_login_accounts!` skips a headless host.

Tests: `test/models/break_escape/network_withholding_test.rb` (new) and the no-exposure test
(section 6) in `test/controllers/break_escape/network_no_exposure_test.rb` (new), over the routes
that exist at this step; steps 3 and 4 add their routes' cases to it.

### Step 3. Server: the jack, the device and the view

Files:
- `config/routes.rb`: the three routes of section 5, each naming its action (`network`,
  `network_plant`, `network_unplug`).
- `app/policies/break_escape/game_policy.rb`: `network?`, `network_plant?` and
  `network_unplug?`, each answering as `show?` does.
- `games_controller.rb`: the three actions (thin: each calls one concern method and renders its
  `{ status:, body: }`, as `login` does); all three join the `set_game` list, and the two that
  write join the `with_game_lock` list; the `scenario` action adds `footholds` and
  `gainedFootholds`; the inventory add refuses a planted device; `filter_container_contents` drops
  a planted device (4.1).
- `network_access.rb`: `object_reachable?`, `held_rogue_device`, `planted_device?`,
  `plant_device!`, `unplug_device!`, `link_item_for`, `footholds_for_client`, `network_view`.
- `game.rb`: `apply_room_state_changes!` hides a planted device; `complete_task!` reads
  `gainedFootholds` for an `unlock_object` task on a jack.

Tests (`test/controllers/break_escape/network_footholds_test.rb`, new; every scenario through
`create_access_game`):
- plant: success moves the device out and the link item in, records both keys and answers
  `first: true`; a second plant answers `already: true` and writes nothing; no device, a forged
  `rogueDevice` field on some other inventory entry, an unreachable jack and an unknown jack are
  each refused with the status of section 5 (422 `no_device`, 422 `no_device`, 403 `unreachable`,
  404) and leave the state alone; a `device_id` naming a device that is not held is refused with
  `no_device` although another is held; an unplug at a jack with no foothold is 422
  `not_planted`; a device defined in each of the five homes plants, and for each home, while it
  is planted, that home does not offer it again (its room's data, its container's
  `GET /container` listing, the NPC's held items, the grant);
- one device: after a plant the device is not in its room's data, with `objects_removed` written
  and also with that write removed by hand; an inventory add for it is refused; with the same
  device, a plant at a second jack is refused with `no_device`;
- unplug: the device is in the inventory exactly once, the link item and foothold are gone,
  `gainedFootholds` keeps the jack, and a second plant answers `first: false`;
- the link item has exactly the shape of 4.1, with `storeIn` only when the jack sets `linkStoreIn`;
- the view: empty with no foothold; the foothold's network with its hosts and resources in scenario
  order; nothing from the other network; a PC under a `remote: "blocked"` policy listed with
  `remoteSignIn: false` and no `session` even when a session is held there; a claimed session's
  row with no `session`; a headless host with `headless: true`; no `access`, username or content
  string anywhere in the answer;
- every new action with an unauthorised player answers as the existing actions do (the policy
  methods exist);
- an `unlock_object` task on a jack completes after the plant, stays complete after an unplug, and
  does not complete before;
- reset with a device planted: both keys empty, no link item, the device back in its room's data;
- every route answers sensibly for a `player_state` that has neither new key (a game from before
  this slice).

### Step 4. Server: remote sign-in, headless hosts, shares

Files:
- `game.rb`: `attempt_login!` takes `foothold:` and runs section 5's checks, the headless refusal
  included; `claim_login_session!` refuses a claim with a foothold or on a headless host;
  `start_login_session!` and `login_session_answer` carry `foothold`, `remote` and, for a remote
  session, `host` (4.4);
  `login_scope_of` walks `resources` and returns the `resource` scope for the record and for what
  is in it; `session_admits?` and `scope_admitted_by_session?` gain the `resource` case;
  `find_scenario_object` walks `resources` after the profiles; `login_desktop_contents` appends the
  share stubs; `find_login_item` also searches the shares mapped for that PC's session.
- `network_access.rb`: `host_reachable_through?(foothold_id, pc)`, `remote_blocked?(pc)`,
  `desktop_request_allowed?(pc, foothold_id)` (the one place a desktop request is judged, 4.4),
  `resource_admits_player?`, `resource_acl_admits?`, `mapped_shares(pc, npc)`,
  `end_sessions_through!(foothold_id)` (called by the unplug), `account_capture_usernames` (the
  `accounts` map of 4.4, from the keys of `account_capture_passwords`).
- `games_controller.rb`: `login` passes `foothold`; `container` and `render_login_desktop` judge a
  desktop request by its `foothold` parameter (4.4), answer the two 403 reasons, clear a session's
  `foothold` when served physically (and the comment above `container` is rewritten: the action
  now writes and must stay locked), refuse a foothold request for a claimed session with 403
  `unreachable`, and serve a resource through the scope branch with the unknown-id 404 on
  refusal; `unlock` and the inventory add answer a refused resource with their own unknown-id
  422 (4.5); `login_accounts` refuses a headless host; the inventory add takes
  `source_resource_id`, and the "already held" shortcut and the Copy record treat it as they treat
  `source_pc_id`; `find_object_in_scenario` walks `resources`; `capture_secrets` adds `accounts`. `find_accessible_item` and `find_container_in_scenario` are **not** changed.

Tests (`test/controllers/break_escape/network_remote_signin_test.rb` and
`network_shares_test.rb`, new):
- remote sign-in to a PC in a locked room succeeds through a foothold on its network, and the room
  stays locked; with no foothold parameter, with an invented foothold id and with a foothold on the
  other network it answers 403; a `remote: "blocked"` PC answers `remoteBlocked` for a right and a
  wrong password and counts no failure; wrong passwords count on the same counter as local ones and
  lock out at the policy's limit, remotely and locally alike; an account the PC does not admit gets
  the not-permitted answer; `claim: "owner"` and an invented claim, each with a foothold, are
  refused;
- headless: a sign-in, a claim and `/login_accounts` with no foothold are refused although its room
  is open; a sign-in through a foothold succeeds; `GET /container` for it without `foothold` is 403
  `unreachable` with a session held, and with `foothold` serves the desktop;
- how a desktop request is judged: with a remote session and the PC's room locked, the request with
  `foothold` is served and the one without is 403; with the room unlocked both are served, and the
  one without clears the session's `foothold`; after an unplug a session that still had its
  `foothold` is gone (403 `no_session`) and one that was cleared survives; a local session at a PC
  in an open room is unaffected throughout; a remote sign-in at a PC where the player already
  holds a local session replaces it, and an unplug then ends it; a foothold request for a claimed
  session is 403 `unreachable` and the claim is kept; a physical desktop request that clears a
  `foothold`, run against a concurrent unplug of the same foothold, leaves either the session
  without its `foothold` or no session, never a session that still names the gone foothold;
- shares, the rule of 4.5: an open share opens from the view with a foothold; it opens from a local
  desktop with **no** foothold; it is refused with neither; a protected share is a stub on an
  admitted account's desktop, local or remote, and not on another's, and not when the PC has no
  network or is on the other network; the same four cases for Copy and Move; a locked folder in a
  share is refused by `/unlock` and `/container` without an admitted source and opens with one;
- lookups: the no-exposure test's second group (section 6); a plain `POST /inventory` add naming a
  share item's id, with a foothold held, is still refused (only `source_resource_id` or a desktop
  reaches a share);
- `/capture_secrets`: `accounts` holds an account capture's username and not a landing-page
  capture's address; with `revealSecret` off, `accounts` still holds it and `secrets` is empty;
  the single-secret fallback never adds an entry to `accounts`;
- the refusal bodies: a refused share id on `POST /unlock` and `POST /inventory` has the same
  status and body as an invented id on that route (compared field by field);
- the first slice's `access_model_*` controller tests pass unchanged.

### Step 5. Validator, schema, dungeon graph and author docs

Files: `scripts/scenario-schema.json`, `scripts/validate_network.rb` (new),
`scripts/validate_scenario.rb` (the hooks of 7.2), `scripts/generate_dungeon_graph.rb`, and
`README_scenario_design.md`: a "Networks" section after "Item plants" (fields, the jack and the
device, what a foothold shows, headless hosts, shares, the events, and the two authoring rules: a
chain that must need the foothold puts its payoff on a headless host or in a room with no other way
in; and remote sign-in skips doors, so acknowledge it or block it in the policy). The section
says that `headless` on an object means "no screen or keyboard, managed only over the network",
which is unrelated to the headless NPC records of the social engine (`emailRecord`,
`Game#headless_npc_records`) and to a headless browser run, and that the implicit `staff` role
counts in every access list a share or host uses.

Tests: the two new node test files of section 7. The existing validator and graph tests pass
unchanged, and every existing scenario validates as before (none uses a new field; section 11).

### Step 6. Playtest tooling

Files:
- `tools/playtest/lib/access_leak_scanner.rb`: new secrets from the game's scenario data: every
  network `name`; every resource `name`, `host` and `observations`; the names and texts of items
  under `resources`. Matching follows the scanner's present rule and states it: a string of six or
  more characters is matched as a substring; a shorter one only as a whole JSON string value; a
  string that also appears somewhere public (a room, door sign, object or NPC name, or any text
  room data ships as authored) is not a secret and is skipped. New rules: a share item's content
  anywhere but a `GET /container` answer for that resource or a folder in it; a network or resource
  string in any response other than `GET /network`, a `/network/*` answer, a `/container` answer,
  the `footholds` block of `/scenario`, or an NPC's `work` block once slice 9.2 exists (13.2). As
  now, a finding names the rule, the route and the owner, never the value.
- `tools/playtest/verify-run.rb`: the `--access` section also prints `footholds`,
  `gainedFootholds`, and `remote` and `foothold` beside each session.
- `public/break_escape/js/systems/test-bridge/access.js`: read-only `footholds()` (what
  `network-links.js` holds) and `networkView(footholdId)` (the last view fetched). Documented in
  `docs/test-bridge.md`.
- `.claude/skills/playtest-scenario/SKILL.md`: one paragraph under "Access model checks", with
  how a run drives the network screens: a row's control by its attributes (4.3), for example
  `mg clickSelector '[data-host-id="lena_pc"] [data-action="sign-in"]'` while the view is the
  active minigame, and the jack's prompt with the session's `click` command on its button text
  (`{"cmd":"click","text":"Unplug it"}`), because a `gameConfirm` is not a minigame and
  `mg clickSelector` looks only inside one. `docs/test-bridge.md` gains the same lines.

Tests: `test/unit/access_leak_scanner_test.rb` gains a case per new rule (a network name planted in
room data is reported; the same name in a `/network` answer is not; a five-letter resource name is
reported only as a whole value; a name that is also a door sign is skipped; no output line holds a
value); `test/js/playtest-verify-run-access.test.mjs` and `test/js/test-bridge-access.test.mjs`
gain the new fields.

### Step 7. Client: the jack and the link item, and the scenario `test_access_networks`

Files, under `public/break_escape/js/`:
- `api-client.js`: `networkPlant`, `networkUnplug`, `network`; `foothold` in `login`'s fields.
- `systems/inventory.js`, after the engine feedback plan's stream E3 has committed its tray
  refresh (section 14): two exported functions and nothing else changed in behaviour:
  `showServerItem(itemData)` (show an item the server has already added, with no request: the path
  a reload takes through `createInventorySprite`) and `syncInventoryFromServer(inventory)` (add
  what the server's list has and the tray lacks, remove what the tray has and the list lacks, for
  the item ids passed). Each ends by calling E3's `refreshInventoryTray()`, so a server-made item
  is filed and decorated like any other. The inventory add also sends `source_resource_id` when
  the sprite carries `sourceResourceId`. All of this slice's edits to `inventory.js` are in this
  step, by one builder.
- `systems/network-links.js` (new, `window.networkLinks`): the foothold list, filled from the
  server's answers and from the scenario response on load; `interactJack(sprite)`;
  `open(footholdId, { returnTo })` and `openSession(pcId, { returnTo })` (open a held remote
  session's desktop through its foothold; used by the view and offered to the capture log, 13.4),
  each starting a trip, with `returnTo` an optional function as 4.3 defines it; the trip and its
  landing table (4.3, "Getting back"): `resume(message)`, `leave(reason)`,
  `landed(screen, reason)` and the `network_view_closed` event; `view(footholdId)`; the tray
  changes through the two functions above; the jack's `plantedSprite`; `<jackId>_planted`, set
  from the scenario response before any room loads (8); the events of 3.5; opening the view on a
  plant whose answer says `first`. It is to networks what `pc-sessions.js` is to sessions: the
  only place the client asks.
- `systems/interactions.js`, after E3 has committed its edits to the file: two short branches in
  `handleObjectInteraction` after the sign-in PC branch (`networkJack`, and an inventory item of
  type `network_link`), each a call into `network-links.js` and a return.
- `core/game.js`: hand `footholds` and `gainedFootholds` to `network-links.js` where it hands
  `sessions` to `pc-sessions.js`.
- `systems/objectives-manager.js`: `network_foothold_gained` meets an `unlock_object` task on its
  source; the load-time reconcile also reads `gainedFootholds`.

Until step 8 lands, `open` and `openSession` show a one-line toast naming the network and end the
trip at once (`leave("closed")`, so a `returnTo` runs); step 8 supplies the view and the remote
desktop they call, with no further edit to `network-links.js` (they look the two starters up on
`window` when called).

Client tests (`test/js/`):
- `network-links.test.mjs` (new): a jack click with no device shows the resolved hint and sends
  nothing; with a device it confirms first, and a cancelled confirm sends nothing; a success shows
  the link item with no inventory request, removes the device from the tray, publishes
  `<jackId>_planted`, emits `network_device_planted` and `network_foothold_gained` once each and
  opens the view when `first`; a planted jack asks with "Unplug it" and "Leave it", "Leave it"
  and Esc send nothing, "Unplug it" emits `network_device_unplugged` with `endedPcIds` and
  restores the tray; on load the list is restored, a missing link item is shown again, no request
  is sent, and `<jackId>_planted` is true for each held foothold's source and false for a gained
  one that is no longer held, before any room has loaded; the landing table of 4.3, one case per
  row, with stub screens calling `landed`: `resume` and `leave` do nothing when a minigame has
  opened in the meantime, `network_view_closed` fires once per trip and never on a handover, and
  `returnTo` runs once, after the landing, with the reason.
- `inventory-server-items.test.mjs` (new): `showServerItem` adds without a request;
  `syncInventoryFromServer` adds and removes only what differs; both call `refreshInventoryTray`
  once; a link item whose `storeIn` names a held holder is filed by E3's rule.
- `objectives-network-footholds.test.mjs` (new, in the pattern of `objectives-signin-pc.test.mjs`):
  the task completes on the event and on load from `gainedFootholds`.
- `interactions` routing: a jack and a link item each reach `network-links.js` and never the
  generic flow.

**`scenarios/test_access_networks`** (new; it follows the main plan's rules for feature scenarios:
`mission.json` in the `test_scenarios` collection, a `lobby` start room, a sign at each beat that
never holds a secret, one task per beat completed by a mapping on the beat's own event, and
`PLAYTEST.md` with one numbered step per beat and the server record expected after it). The whole
scenario is authored in this step; beats that need step 8 get their static checks now and their
runs then. Every name a network or resource shows is six or more characters and appears nowhere
else in the scenario, so the leak check can test it.

- **Networks:** `office_lan` ("Harbour office LAN") and `workshop_lan` ("Workshop bench LAN").
- **Accounts** (three NPCs standing in the lobby, no needs, no owned PCs): Sam Okafor (`staff`
  only), Lena Fox (`finance`), Ian Shaw (`it`). Every account holder also has the implicit
  `staff` role, so Lena and Ian can sign in at `sam_pc` and `kiosk_pc` too; the scenario's
  `PLAYTEST.md` says so, and the expected validator output below counts it.
- **Policies:** `hardened` (`remote: "blocked"`), `counted` (`maxAttempts: 5`,
  `remote: "allowed"`).
- **Rooms and objects:**
  - `lobby`: the drop box (`kit_dropbox`, `rogueDevice`) on a table; `lobby_vault`, a PIN safe.
  - `comms_room` (open): `comms_port`, a jack on `office_lan`, `plantedSprite: "pi_cluster1"`.
  - `workshop` (open): `bench_port`, a jack on `workshop_lan`.
  - `desk_room` (open): `sam_pc`, host `HB-DESK-01`, on `office_lan`, `access: { roles: ["staff"] }`,
    Sam's password on its `postitNote`.
  - `finance_office` (PIN door): `lena_pc`, host `HB-FIN-02`, on `office_lan`,
    `access: { roles: ["finance"] }`, policy `counted`.
  - `kiosk_room` (open): `kiosk_pc`, host `HB-KIOSK-01`, on `office_lan`,
    `access: { roles: ["staff"] }`, policy `hardened`.
  - `store` (open): `door_box`, host `HB-DOOR-01`, on `office_lan`, `headless: true`,
    `access: { roles: ["it"] }`. Its `contents`: "Door codes", which gives the `finance_office`
    door PIN and the `lobby_vault` PIN.
- **Resources:** `scanned_inbox` ("Scanned-Inbox" on `HB-FS01`, open, `office_lan`), holding a
  starter letter with Lena's username and password as a deliberate clue (the remote screen has no
  tiles, so the username must be readable somewhere); `ledger_archive` ("Ledger-Archive" on
  `HB-FS01`, `office_lan`, `access: { roles: ["finance"] }`), holding an IT handover note with
  Ian's username and password and a PIN-locked folder "Year-end" whose PIN is in the same note;
  `print_queue` ("Office print queue" on `HB-PRN-01`, `office_lan`, `observations` only);
  `bench_notes` ("Bench-Notes" on `WS-NAS-01`, open, `workshop_lan`).

| Beat | Set-up | What should happen | Server record afterwards |
|---|---|---|---|
| P1 An open share at the keyboard | `sam_pc`, before anything is planted | Sam's password from the sticky note signs in. His desktop shows the "Scanned-Inbox" folder and no "Ledger-Archive". The folder opens and the starter letter reads | `sessions.sam_pc` Sam, no `foothold`; no `footholds` |
| P2 Plant | `comms_port`; the drop box on the lobby table | Before taking the box, the jack shows its hint. With the box, cancelling the confirm changes nothing. Confirming plants it: the box leaves the tray, the link item arrives, the jack changes look, and the network view opens by itself | `footholds.jack_comms_port` on `office_lan`; `gainedFootholds` has `comms_port`; the link item in the inventory and the box not |
| P3 See | The view | Rows for `HB-DESK-01` (with **Open** and Sam's name, from P1), `HB-FIN-02` (**Sign in**), `HB-KIOSK-01` (remote sign-in off), `HB-DOOR-01` (**Sign in**), "Scanned-Inbox" open, "Ledger-Archive" with the padlock, the print queue. Nothing of the workshop network. The leak check over every response before P2 finds no network, host or share string | No change |
| P4 Open share from the view | "Scanned-Inbox" | It opens; Copy puts the letter in the inventory and leaves it listed; closing returns to the view | `copiedItems` has the letter |
| P5 Remote sign-in | `HB-FIN-02`; the door of `finance_office` is still locked | No tiles. Sam's right password answers "This account can't sign in on this PC". A wrong password for Lena answers with 4 attempts left. Her password from the letter opens her desktop, its header naming her and "Remote session through Drop box: comms room", with "Ledger-Archive" mapped. The handover note reads; "Year-end" opens with its PIN | `sessions.lena_pc = { id: "lena", via: "password", foothold: "jack_comms_port" }`; `signedInPcs` has `lena_pc`; `finance_office` still locked; no failure entry for Lena; "Year-end" in `unlockedObjects` |
| P6 Switch user, remotely | Lena's remote desktop | **Switch user** opens the remote sign-in screen with no tiles. Sam's details are refused and Lena's desktop is still there on leaving the screen | `sessions.lena_pc` unchanged |
| P7 Remote sign-in off | `HB-KIOSK-01` | The row offers no sign-in. At the kiosk itself, Sam's password signs in | `sessions.kiosk_pc` Sam, no `foothold` |
| P8 A host with no screen, and the chain | `door_box` in the `store` | A click on the box shows only its observation. From the view, Ian's details from the handover note sign in to `HB-DOOR-01`. "Door codes" gives the vault PIN; the vault opens and the last task completes | `sessions.door_box` Ian, with `foothold`; `lobby_vault` in `unlockedObjects` |
| P9 Sit down at it | `finance_office`, opened with the PIN from "Door codes" | A click on `lena_pc` opens Lena's desktop with no password | `sessions.lena_pc` has no `foothold` now |
| P10 Unplug | `comms_port`, with the `HB-DOOR-01` desktop reachable from the view | The jack says the box is plugged in here and offers "Unplug it" and "Leave it". "Unplug it" returns the box (one box in the tray, none on the lobby table) and removes the link item. `lena_pc` still opens at its keyboard. After planting again, `HB-DOOR-01` asks for the password again | After the unplug: no `footholds`, no `sessions.door_box`, `sessions.lena_pc` kept; `signedInPcs` and `gainedFootholds` unchanged |
| P11 The other network | Unplug, then plant at `bench_port` | The link item is named for the bench port. Its view lists only "Bench-Notes", which opens. Nothing of the office network | `footholds.jack_bench_port` on `workshop_lan` only |
| P12 Reload | A box planted at `comms_port` and a remote session at `HB-FIN-02` | After the reload the link item is in the tray, the jack shows its planted look, the view lists the same rows, Lena's desktop opens from the view with no password and every task stays complete | `footholds`, `gainedFootholds`, `sessions` and `signedInPcs` unchanged |

Task titles and sign texts ship in the bootstrap, so none names a network, a host label or a
share ("Plant the box in the comms room", not "Reach HB-DOOR-01"); otherwise the leak check
reports them.

Expected validator output: the "reachable without a foothold" information lines for the hosts
`sam_pc` and `kiosk_pc` (not headless, in open rooms) and for the share "Ledger-Archive", admitted
for Lena Fox, who as `staff` signs in at both and gets it mapped there. "Scanned-Inbox" and
"Bench-Notes" are open shares and are not on that list, and `lena_pc` (behind a PIN door) and
`door_box` (headless) are not either. The chain still needs the box: the payoff, "Door codes",
is on the headless `door_box`. The `maxAttempts` warning the first slice gives for `lena_pc`. No
"doors skipped" warning (`counted` writes `remote` out). No errors.

**Static checks.** Validator clean apart from the expected lines, dungeon graph generated, node and
Rails suites, the no-password and no-exposure tests.

**Scripted run for this step** (on :3001, headless, `--capture-responses` on, a private scratch
folder): P2 without the view, an unplug and a second plant, and a reload that checks the link
item, the jack's look and `gainedFootholds`. After each beat: `verify-run.rb <game_id> --access`
against the record above, and `access-leak-check.rb` over the responses so far.

### Step 8. Client: the network view, remote sign-in and shares

Files, under `public/break_escape/js/`:
- `minigames/network-view/network-view-minigame.js` (new) and its stylesheet,
  `public/break_escape/css/network-view-minigame.css`, linked from
  `app/views/break_escape/games/show.html.erb` beside the other minigame stylesheets; registered with
  `MinigameFramework.registerScene('network-view', ...)` in `minigames/index.js`, where scenes are
  registered. It needs no entry in `systems/minigame-registry.js`, because it is never opened by an
  object type, an ink tag or an `openMinigame` mapping: only `network-links.js` opens it. It
  renders one `GET /network` answer (4.3) with the row attributes of 4.3, calls out for every
  action, records its exit reason (`handover` before it opens a host or a share) and reports it
  from its cleanup through `networkLinks.landed`.
- `systems/unlock-system.js`: `openRemoteSignIn(hostRow, footholdId)` builds the remote lockable
  (4.4); `openLoginSignIn` and `openLoginDesktop` read `scenarioData.remote` and behave as 4.4
  says; `interactLoginPc` shows a headless object's observations and stops.
- `systems/pc-sessions.js`: `signIn` passes the foothold; a session keeps `remote` and
  `footholdId`, and the events carry them; a 422 with `remoteBlocked` emits `pc_signin_failed` with
  reason `remote_blocked`; `network_device_unplugged` drops the sessions named in `endedPcIds` and
  closes their desktops with "The link dropped"; `list()` entries carry `remote`, `footholdId` and
  `host` (4.4); the desktop close callback receives the reason as a second argument (`sign_out`,
  `no_session`, `link_dropped`, `displaced`).
- `minigames/password/password-minigame.js`: in sign-in mode with `remote`, no tiles, and the
  **Captured sign-ins** list (4.4), built from `readCaptures` (`systems/captures.js`) and the
  `accounts` and `secrets` maps of `/capture_secrets`.
- `minigames/container/container-minigame.js`: the desktop fetch adds `?foothold=` for a remote
  lockable; the remote line in the header; Switch user and the 403 `no_session` fallback go
  through the remote path for a remote lockable (the two call sites of `openLoginSignIn`); a
  `network_share` item opens as a folder whose contents are fetched from `GET /container/<id>`; a
  share started from the view carries `sourceResourceId` on what is taken from it, through the
  four places that test `sourcePcId` today (`offersTransfer` and `takeItem`, `:577-579` and
  `:893-900`, and the two stand-in sprites that carry it into a reader or a nested folder,
  `:751` and `:796`); a `network_share` stub has its own branch that starts the container
  minigame for the share directly, never `handleObjectInteraction` or `POST /unlock` (4.5); a
  network screen records its exit reason and reports it from its cleanup through
  `networkLinks.landed` (4.3, "Getting back").
- `minigames/text-file/text-file-minigame.js`: in `cleanup`, when `pendingContainerReturn` holds a
  network screen (a remote lockable, or a share opened from the view), reopen it instead of
  clearing the record (4.3). Other containers keep today's behaviour.

Client tests (`test/js/`):
- `network-view.test.mjs` (new): the rows and their actions for each kind of host and resource;
  the order of 4.3 for a host row (remote sign-in off wins over a held session; a claimed session
  shows **Sign in**); **Open** for a password session, whether or not it is remote; the row
  attributes; `network_viewed` and `network_host_opened`; a refetch on return from a desktop; a
  handover does not emit `network_view_closed` and the view's own Close does; it never reads
  scenario data.
- `access-remote-signin.test.mjs` (new): a remote lockable opens the screen with no
  `/login_accounts` request and no tiles, whatever picker the PC has; the request carries the
  foothold; Switch user on a remote desktop opens the remote screen, and a refused switch leaves
  the first session's desktop; a 403 `no_session` on a remote desktop returns to the view, drops
  the client's session and never opens the physical screen; a 403 `unreachable` returns to the
  view with its reason and keeps the client's session; closing the remote sign-in screen with no
  session returns to the view; a headless object's click shows its observations and opens
  nothing.
- `pc-sessions.test.mjs`: a remote sign-in emits `pc_signed_in` with `remote: true`;
  `remoteBlocked` emits reason `remote_blocked`; an unplug ends exactly the sessions named.
- `password-signin-mode.test.mjs`: the captured list shows only targets in `accounts`, fills the
  username always and the password only when `secrets` has it, and is empty with no captures.
- `container-shares.test.mjs` (new): a share stub fetches its contents on open; the inventory add
  from a mapped share carries `source_pc_id`, from a share opened in the view
  `source_resource_id`; the remote desktop fetch carries `foothold`; a share stub never calls
  `handleObjectInteraction` or `/unlock`; a text file read from a remote desktop reopens the
  desktop when closed, and one read from an ordinary container still closes to the world.

**Scripted runs**, each a new game, 10 to 15 minutes, every password read from its in-game source
and listed in the earned-secrets table:
- Run A: P1 to P6, with a reload after P5. In P5 the run reads the handover note, is back on
  Lena's desktop when the reader closes, and closes the desktop to the view.
- Run B: P2, P4, P5, then P7, P8 and P12.
- Run C: P2, P4, P5, P8, then P9, P10 and P11.

Then the first slice's three suite runs (`test_access_doors`, `test_access_signin`,
`test_access_sessions`), because the sign-in screen, the desktop fetch and `pc-sessions.js` changed
under them.

### Step 9. `lab_physical_pentest`

Section 10. It starts once step 8's runs pass and the conditions in section 10 hold.

## 10. How `lab_physical_pentest` adopts it

**Aim.** Plant the box, see what the office network exposes, and reach something with a captured
password that neither the box nor the password reaches alone.

**Whose plan.** The lab's text, rules of engagement, Ruth's lines, objectives and debrief belong to
`PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md` ("the content plan"). That plan designed these beats
before this mechanism existed, with hand-built stand-ins: an inventory item `dropbox_console`
granted by a timer, and an item `door_admin_page` granted when two client globals are both true.
This section replaces those two stand-ins with the real mechanism and changes nothing else in the
content plan's design. It keeps the content plan's scope rule: **client records stay out of
scope**, so the records share is listed and never opened.

**How to apply it.** The recipe is written by object id, global and task id, never by line number,
because the user's own lab file has changes that are not in this repository. An id marked (content)
is one the content plan creates; the builder applies this recipe to the lab file as it stands after
the content plan's scenario stream, on whatever base the user pushes.

### 10.1 What the slice gives the lab with no content decision

| Id | Change |
|---|---|
| top level | `"networks": { "office_lan": { "name": "Ledgerwell office LAN" } }` |
| `kit_dropbox` | Add `"rogueDevice": true` |
| `network_port` (room `P3`) | Add `"networkJack": true`, `"network": "office_lan"`, `"plantedSprite": "pi_cluster1"`, `"linkName": "Drop box: comms cupboard"`, `"linkStoreIn": "capture_log"` (13.4; added only once the lab has the capture log item), and `"jackConfirm"` holding the confirm text the content plan writes for it. Remove `requiresItem`, `triggerOnInteract` and its `confirm_action` (the jack does all three); keep `requiresItemHint`. Add an `observationVariants` entry on the global `network_port_planted` for the content plan's "this is the foothold" text |
| Ruth's mapping on `global_variable_changed:kp_netdrop_planted` | Change the pattern to `network_device_planted:network_port`; keep `onceOnly` and the `addCapture`. With the objective change in 10.2 accepted, drop its `completeTask`: the task completes itself. Until then keep `completeTask: "opt_netdrop"` and add `setGlobal: { "kp_netdrop_planted": true }`, so her ink and the debrief keep reading the same global |
| object `network_port_planted` | Removed. The jack's own planted look shows the device where it was planted, which is what the engine feedback plan wants kept visible, and the jack's observation variant carries its text. (The published global has the same name as the removed object's id; they are different things) |

The box is now really planted: it leaves the tray on confirm, the link item arrives, the view opens
by itself, and the box comes back on an unplug.

### 10.2 The content plan's hand-built pieces, mapped to this mechanism

| Content plan | Becomes |
|---|---|
| `dropbox_console` (content), its `give_item` timer on `kp_netdrop_planted`, and its file "What answers" | Not created. The link item and the network view are the console |
| Host note "LW-FS01" (the records share is listed to any device, folder names only) | `resources.lw_fs01_records`: `kind: "file_share"`, `name: "Client-Records"` (a name no room text uses, so the leak scanner can check it; the word "records" is public all over the lab and would be skipped by the scanner's own rule; the content plan's mapped-drive file on `lord_desktop`, served only to a session, names the share the same way), `host: "LW-FS01"`, `network: "office_lan"`, **no `contents`**, and `observations` giving the top folder names and the content plan's line that reading them would be a breach of its own. Nothing in it can be opened, copied or taken, which is the scope rule made mechanical |
| Host "LW-PRN02" (printer) | `resources.lw_prn02`: `kind: "printer"`, `host: "LW-PRN02"`, `network: "office_lan"`, a one-line `observations` |
| "the staff PCs" | `hot_desk_pc` (content) and `staff_pc_2` gain `"network": "office_lan"` and a `host` (`staff_pc_2` is `LW-OPEN-07`, the host its capture already prints). Their `access` lists stay exactly as the content plan sets them: the hot desk admits its three people, Melanie's PC only her. `staff_pc` and `usb_target_pc` stay plain PCs and are not listed |
| Host note "LW-DOOR01" and `door_admin_page` (content) with its two timers on `kp_netdrop_planted` and `kp_creds_captured` | A new object, `door_controller`, in `store_room` beside `store_shelf` (the shelf's text already places the controller there): `"type": "pc"`, a rack sprite, `"name": "Door entry controller"`, `"host": "LW-DOOR01"`, `"network": "office_lan"`, `"locked": true`, `"lockType": "login"`, `"headless": true`, `"loginPicker": false`, `"access": { "people": ["hampshire"] }`, an `observations` line saying it has no screen and is managed from the office network, and as `contents` the three pages the content plan wrote for `door_admin_page` (the door list, the card type, "Add badge: in reach, not pressed"). The two timers and the granted item are not created |
| `kp_dropbox_viewed` set by `onRead` of "What answers" | Set by a mapping on `network_viewed:office_lan`, `onceOnly`, `setGlobal: { "kp_dropbox_viewed": true }`. The content plan's mapping from that global to `opt_dropbox_view` and its capture are unchanged |
| `kp_door_admin` set by the first read of `door_admin_page` | Set by the server, as below. Until that change is accepted: a mapping on `pc_signed_in:door_controller`, `onceOnly`, `setGlobal: { "kp_door_admin": true }`, and the content plan's mapping to `opt_door_admin` unchanged |
| `opt_netdrop` and `opt_door_admin`, completed from client events and globals (for the content plan's owner to accept) | Two `unlock_object` tasks the server checks. `opt_netdrop`: `"type": "unlock_object"`, `"targetObject": "network_port"`, `"onComplete": { "setGlobal": { "kp_netdrop_planted": true } }`; the server completes it only when `gainedFootholds` holds the jack. `opt_door_admin`: `"type": "unlock_object"`, `"targetObject": "door_controller"`, `"onComplete": { "setGlobal": { "kp_door_admin": true } }`; the server completes it only when `signedInPcs` holds the controller, which only a sign-in through the box can put there. Each keeps its id, title and `optional`; the client completes it on `network_foothold_gained` and `pc_signed_in` (step 7 and the first slice). The server writes each global when it completes the task (section 2, "Globals"; it writes only a global declared in `globalVariables`: `kp_netdrop_planted` is declared today, `kp_door_admin` by the content plan), so Ruth's ink and the credits follow a server check. The content plan's mapping from `kp_door_admin` to `opt_door_admin` goes; its `addCapture` moves to a mapping on `pc_signed_in:door_controller`, `onceOnly`. `opt_dropbox_view` stays a mapping on `kp_dropbox_viewed`: looking is not a gate |
| The content plan's texts that say "its console is in your inventory" | Stay true: the link item is in the inventory |

**Why this payoff needs the box.** The door controller is headless. It stands in the store room,
which a picked lock opens, and a click there shows only that it has no screen. The server refuses
any sign-in to it that names no foothold on the office LAN (4.7), and then checks Chris's password,
which the player has only from the keylogger. So the chain the content plan drew, "drop box plus
Chris's password", is enforced by the server at both ends, where today it rests on two globals the
browser sets, and with the objective change above the task that records it is completed only
after the server's own check. Nothing else in the lab opens the controller's pages: Melanie's claimed session, the
hot desk and the records share do not lead to it.

**Left as they are by this slice:** the Remote Session item (`records_remote_session`) and its
timer, `usb_target_pc`, `cable_note`, the hot desk beat and its three desktops, every global and
task id the content plan names. 9.3b's implants may later offer the BadUSB beat a better form; that
is a separate decision (section 12).

### 10.3 Tests and runs

- `test/models/break_escape/lab_physical_pentest_secrets_test.rb` gains: no room or bootstrap answer
  names the network or a resource before the plant; `door_controller`'s pages are served only to a
  session as `hampshire` opened through a foothold, and a sign-in there with his right password
  and no foothold is refused; the records resource has no contents.
- The content plan's playtest steps for the console and the chain (its H5.3 and H5.4) are rewritten
  for the mechanism: plant, the view opens, `opt_dropbox_view` completes; with no capture the door
  controller's row refuses a guessed password; after the keylogger capture, **Captured sign-ins**
  offers `c.hampshire`, the sign-in succeeds, `opt_door_admin` completes; unplug; a reload with the
  box planted.
- A scripted regression run of those beats with the two checks after each, then a persona run as a
  student who does not know the answers, judging whether the view reads as "what my box can see",
  whether the door controller's row and the store room object connect in the player's mind, and
  whether the chain makes the consequence of one captured password clear. A persona run confirms
  any "stuck" a scripted run reports before it counts as a bug.

### 10.4 When

This step starts when all of these hold:

1. Step 8's runs pass.
2. The content plan has been revised to use this mechanism in place of its two stand-ins (the user
   or the orchestrator confirms it), and its own scenario stream has finished its edits to the lab
   file. If the content plan's build runs before 9.3a is ready, it builds its stand-ins and this
   step replaces them afterwards; either order ends in the same file.
3. Nobody else is editing `scenarios/lab_physical_pentest/scenario.json.erb` or
   `lab_physical_pentest_secrets_test.rb`. The lab file has one editor at a time; slice 9.1's lab
   step runs after this one.

## 11. Effects on existing scenarios

No scenario uses `networks`, `resources`, an object `network`, `networkJack`, `rogueDevice` or
`headless` today (checked across `scenarios/`; the `networks` lists in the
`ca20_remote_and_mobile_working` scenarios are a nested Wi-Fi list page, unrelated), so every
change below is inert until a scenario opts in.

| Change | Effect on a scenario that does not use networks |
|---|---|
| The bootstrap deletes three top-level keys | None: the keys are absent |
| The room filter deletes `network` and the link fields | None |
| A desktop request is judged by its `foothold` parameter | Without the parameter the test is today's "PC reachable", plus "not headless", which no existing PC is |
| The desktop's 403 carries a `reason` | `pc-sessions.js` treats `no_session` and a missing reason as it treats a 403 today |
| `POST /login` reads `foothold`; claims with a foothold are refused | Without the parameter the route is unchanged |
| The desktop gains share stubs | None without `resources` |
| `login_scope_of`, `find_scenario_object` and `find_object_in_scenario` walk `resources` | Nothing to walk |
| The inventory add refuses a planted device; room data hides one | No footholds, so nothing matches |
| `GET /capture_secrets` gains `accounts` | An added key; `secrets` is unchanged and existing readers ignore the new one |
| Two new branches in `handleObjectInteraction`, two exports in `inventory.js`, a remote mode in the sign-in screen | Reached only by the new fields and parameters |
| Policy `remote` | Absent means allowed, and nothing can sign in remotely without a network |
| Validator | `check_network_model` returns at once when the scenario has none of the new fields |

No existing route gains a new refusal for an existing scenario. Scenarios to rerun because shared
code changes under them: the first slice's three suite scenarios (step 8), and
`lab_social_engineering`'s captures terminal once, because `/capture_secrets` gains a key. The
needs scenarios are untouched: this slice changes nothing in `npc-needs.js` or
`workstation-state.js`, and it does not touch `door-gates.js`.

## 12. Slice 9.3b: links, outages, Wi-Fi, port security, implants

A shorter design, in build order. Each part stands on 9.3a and on the parts before it. It gets its
own build-ready plan and review when 9.3a has shipped; what is fixed here is the model, so 9.3a
reserves the right fields and the sibling slices know what to expect.

### 12.1 Links, and the pivot through a session

- `networkLinks` is a list of pairs of network ids. A link is undirected and says that **members**
  of one network can reach the other: the staff PCs on the office LAN reach the server network.
- **A rogue device is not a member.** A foothold from a jack still reaches only its own network.
  This is the segmentation lesson in one rule, taught as "the servers accept connections only
  from managed machines", which is true where it is done (a firewall that filters by address
  alone would let a box with an office address through).
- **A host has one `network` in 9.3a.** The usual real control is that only named jump hosts reach
  the server network, which needs a list of networks on a host or a per-host link. `network_of`
  keeps returning one id in 9.3a, the schema does not forbid a list later, and `NetworkModel`
  callers are written against "the networks of an object".
- **A session is a place to stand.** When the player holds a session at a sign-in host that the
  foothold reaches (any session there, however it was opened, so sitting down at a pivot host,
  which clears the session's `foothold` in 9.3a, does not cut the pivot), that foothold's reach grows by every network the host reaches over
  links. The view shows those networks as a further block, "Servers, through HB-FIN-02 (signed in
  as Lena Fox)", and their hosts can be signed in to in turn, which can extend reach again. Signing
  out, or unplugging, shrinks it back.
- So a network chains to a network only through something the server checked: the password of the
  session the player pivots through. Nothing between two networks rests on a client-written value.
- Server: `NetworkModel.reach_from(network)` (the network and everything linked to it, through
  networks that are up) is what a member reaches; `player_reach(foothold)` starts from the
  foothold's own network and repeatedly adds `reach_from(host network)` for each host it already
  reaches at which the player holds a session. Mapped shares on a desktop use `reach_from` of the PC's
  network, so a finance PC maps a share on the server network for the player exactly as it does for
  the member of staff.
- `GET /network` gains, per foothold, `networks: [{ id, name, via: { hostId, host, displayName } |
  null, hosts }]`.
- `reach_conditions` for slice 9.2 uses `reach_from`: NPC stations are members.
- Feature beats: a jack on the office LAN shows no server network; after a remote sign-in at the
  finance PC the server network appears through it; a host there is signed in to; signing out of
  the finance PC removes the block and ends the onward session.

### 12.2 Outages

- `downIf` on a network (and, for the player's side, on a resource) names a global. While it is
  truthy the network is down: members and pivots do not reach through it, its hosts leave the view,
  desktops and shares on it are not served.
- **Truthy is JavaScript's.** The browser decides the same question for NPC work (13.2), so
  `NetworkModel.truthy?(value)` matches JavaScript: false for `false`, `nil`, `0`, `""` and a
  missing key, true for everything else, the string `"false"` included. It is tested with each of
  those and used everywhere the server reads a `downIf` global. The server reads the global from
  `player_state.globalVariables`, falling back to the scenario's default.
- **What the player sees.** A network reached through a pivot that is down shows as one greyed
  line, "Servers: no route". Under it, each host with a session held through this foothold keeps a
  greyed row whose click says "No route to <host>", so a held session is never silently missing.
  The server keeps such a session and answers its desktop request 403 `unreachable`; when the route
  returns it opens with no password. Because a desktop request is judged by its `foothold`
  parameter alone (4.4), the answer does not depend on which doors happen to be open. In 9.3b the
  scoped requests under a remote desktop (folders, the inventory add, an unlock) carry the
  foothold too and are judged on the route.
- **Keeping the server's view current.** The client awaits `window.stateSync.sync()` before
  `GET /network`, a remote sign-in, and any desktop or share fetch while a foothold is held or the
  last desktop showed a mapped share. An open view refetches every five seconds; it does not
  refetch on every global change, because the needs and workstation layers publish globals all the
  time.
- **Strength.** A `downIf` global is written by the browser, or by the server when it completes a
  task whose `onComplete.setGlobal` names it (section 2) or, once slice 9.2 exists, by a
  workaround. A global tied to a server-checked task is stronger than a client event, but the
  browser can still write any global, so an outage is pacing and a distraction tool, never
  protection: anything that
  must not be read early sits behind a session as well. The validator warns about an open share
  with contents behind a network that starts down. An undeclared `downIf` global is a validator
  warning, the level slice 9.2 gives the same mistake.
- `reach_conditions` then returns, per route, the `downIf` globals of every network on it, the
  station's and the resource's own networks included (the resource's own `downIf` is 9.2's and is
  not repeated). Routes are simple paths, shortest first, at most eight; the validator warns when
  a link graph has more, and the answer is tested on a graph with a cycle.

### 12.3 Wi-Fi

- `networks.<id>.wifi = { ssid, psk }`; the key lives there and nowhere else, in a block that never
  ships. `psk` absent means an open network. An access point is any room object with
  `"wifiAp": true` on such a network; several may serve one network.
- Clicking an access point asks for the key in the password minigame's key mode; the server
  compares it (`POST /network/join`). The foothold is `wifi_<networkId>`. A Wi-Fi foothold, like a
  jack's, reaches its own network only.
- Joining through a second access point of a network already joined answers `already: true` **and
  still** adds that access point to `gainedFootholds` and emits `network_joined` for it, so a task
  or mapping on either access point completes.
- No device and no range: the server could not check range.
- The link item's picture is the access point object's own sprite, never the phone's, so the tray
  does not hold two phone icons that open different things.
- A Wi-Fi key is a lock secret like a door PIN, not an account password: ink may say it. The
  validator warns when a key appears nowhere the player can read; where slice 9.1 is built it uses
  `NpcHabits::Clues.readable_texts` for that list, so both slices agree on what the player can
  read, and slice 9.2 adds `feed.posts[].text` to it.
- Strength: the comparison is on the server and the browser never holds the key. Wrong keys are
  not counted (declined, section 17), so the validator warns about a key shorter than eight
  characters.

### 12.4 Port security

`"portSecurity": true` on a jack, with an optional `portSecurityMessage`: the device goes in, the
switch refuses an unknown device, no foothold is given and the device stays in the inventory
(`network_device_refused`, reason `port_security`). It shows the fix the lab's text already names.
It only refuses; a bypass is not part of this slice.

### 12.5 Implants

An implant is a foothold that a member of staff gives the player by plugging in a dropped device.

- A scenario action, `{ "type": "grant_foothold", "pc": "<pc id>", "needsDropped": "<item id>",
  "name": "..." }`, on a path the engine runs actions from and the server's declared-grant walk
  covers. The validator errors on one under `flagRewards` (the flag station runs actions in the
  browser, while that path is off the server's list) or `eventMappings`, and on one with no
  `needsDropped`.
- **It gives a foothold and nothing else.** No session, no desktop, no owner's access. The foothold
  is on the PC's own network and, like every foothold, reaches only that network. The owner's
  desktop still needs the owner's password through the ordinary remote sign-in. The BadUSB beat
  becomes "the stick gives you the network; the keylogger or the phish gives you the account",
  which is a chain and not a gift.
- **The server checks what it can.** `POST /network/implant` requires: the scenario declares the
  action for that PC; the server's own record shows the `needsDropped` item left the inventory
  through a drop, read from `droppedItems`, the grow-only list of accepted player drops that the
  engine feedback plan's stream E4 writes in `add_item_to_room!` (a drop's own room entry goes
  when the item is picked up again, `game.rb:444-452`, so it is not a durable record); and, where
  slice 9.2 is built, the PC's policy does not refuse that item's `usbClass`. A device under a
  blocking USB policy fails **at the use**, not at the drop: it is dropped, picked up and carried
  first, and refused when it is plugged in. The check is a Ruby `usb_refused?(pc, item)` beside
  `effective_policy`, reading slice 9.2's table, with a validator warning for a `grant_foothold`
  whose PC refuses its device; whichever of 9.2's sub-slice U and this part lands second adds
  it. A repeat answers `already: true`.
- Its trigger (the NPC's use) is still reported by the browser, so an implant is weaker than a
  plant and is graded so. What it yields is bounded: a list of hosts, every one of which still
  asks for a password the server checks. That is why it may be client-triggered.
- A scenario that wants "the stick lands you inside her session" builds it from pieces the server
  checks: an implant for the network and a captured password for the account.

### 12.6 What 9.3b adds to the feature scenario and the tools

Beats for each part above in `test_access_networks` (a second network linked to the first, a
down-by-default network repaired by an object, two access points, a port-security jack, a dropped
device an NPC uses), the leak scanner's rule for a Wi-Fi key (nowhere but an authored clue), and
`verify-run.rb` lines for the new foothold kinds.

## 13. Interfaces with other plans

The build order is **9.3a, then 9.1, then 9.2**, with 9.3b after 9.3a at a time the user chooses.
Both sibling plans were re-read in their current versions on 2026-11-10.

### 13.1 Slice 9.1 (awareness and habits)

No disagreement.

| Point | Settled as |
|---|---|
| The Wi-Fi key's home | `networks.<id>.wifi.psk` (12.3). Whichever of 9.1 and 9.3b lands second adds it to `NpcHabits::Clues.secret_homes` for the `reused` check |
| A written-down password | 9.1 serves the note's text only from `GET /login_accounts` for a physically reachable PC. The remote sign-in screen never calls that route (4.4), so **a sticky note is never shown on a remote sign-in screen**; the player reads it at the desk and types it remotely. The password itself signs in remotely as it does locally |
| "The key appears nowhere" warning | 9.3b uses 9.1's `Clues.readable_texts` where 9.1 is built (12.3) |
| `attach_login_accounts!` | 9.1 adds `hasPostit` there; this slice makes it skip a headless host. Different lines of one short method; 9.1 builds after 9.3a and re-reads it |
| An NPC who notices a planted device | Not built by either. `network_device_planted` is the hook |
| The lab file | One editor at a time: this slice's step 9, then 9.1's lab step (10.4) |
| The probe 9.1 asks for (a sign-in PC with `affordance.accepts` still takes an NPC's deliveries) | Not needed by 9.3a: it converts no workstation to a sign-in PC. The lab's `door_controller` is a new headless object with no owner |

### 13.2 Slice 9.2 (work, frustration, workarounds, USB policy, social media)

No disagreement. Its section 15 and this section say the same things.

| Point | Settled as |
|---|---|
| `resources` | Shared. This slice owns `network`, `host`, `contents`, `observations`; 9.2 owns `object`, the work lists and, for NPC work, `downIf`. Both read `name`, `kind` and `access` the same way (no `access` means anyone who can reach it). Neither makes the other's fields required; both delete `resources` from the bootstrap. 9.3a adds the key to the schema and the validator's top-level list; 9.2 extends it |
| Reach for NPC work | Composed on the server. 9.2's `compile_npc_plan!` calls `NetworkModel.reach_conditions(station_network, resource)` and ships the answer as `routes`; no network id, link or resource `network` reaches the browser. 9.3a's answer is in 4.2, 9.3b's in 12.2. In a scenario with no `networks` there are no `routes` and everything is reachable |
| Resource names and `downIf` global names in an NPC's `work` plan | Shipped by 9.2, accepted here: ids and global names are not secret (section 6), and a resource's display name in the plan of an NPC who uses it says no more than that NPC's bark about it. This slice's no-exposure test and leak rule leave an NPC's `work` block out |
| "A resource no NPC needs" | 9.2 does not report it for a resource with `contents` or a `host` |
| A station that is down | 9.2 adds `downIf` on a workstation. It adds two lines here in its step A-3: a host that is down is listed "not responding" in `network_view`, and `desktop_request_allowed?` (the helper that judges a desktop request, 4.4) refuses it |
| A hot desk | A guest session 9.2's `borrow_session` leaves at a hot desk is an ordinary session at a PC on a network, so its desktop carries mapped shares with no extra work. It is claimed at the screen: section 5 refuses every claim that carries a foothold |
| A session can be displaced | When an NPC signs in at a PC, 9.2 ends any session the player holds there, a remote one included, with `pc_signed_out` reason `displaced`. This slice's client treats it like any other end: the remote desktop closes and the view's row goes back to **Sign in** |
| Lockout from the drop box | Remote and local attempts share one counter (4.4), so the player can lock a member of staff out of their own PC from the network, which under 9.2's sub-slice L stops their work and sends them to the hot desk. That is a chain, and both plans allow it. The validator's remote-only lockout warning (7.2) covers the soft lock |
| USB policy and implants | 12.5: the check is at the use, on an item with `usbClass`, and lives in `POST /network/implant`; the slice that lands second adds it |
| The feed | Its shape is `feed.posts[].text`. Where a feed is a source for a Wi-Fi key, the slice that lands last adds it to the key warning's sources (12.3) |
| Server-set globals | 9.2 lets a workaround carry `setGlobal`, set by the server. That is the one case where a global is not client-written; this plan's statements about globals (section 2, 12.2) allow for it |
| Outages | `downIf` means the same in both: the global truthy, by JavaScript's rule, means down. 9.2 owns what an outage does to NPCs; 9.3b what it does to the player's reach |
| Validator layout | Each slice keeps its checks in its own file (`validate_network.rb`, 9.2's `validate_access_work.rb`) and touches `validate_scenario.rb` only for a `require`, a call and the known-field lists |

### 13.3 The lab's content feedback plan

Section 10. The one thing this plan asks of it: replace `dropbox_console`, `door_admin_page` and
their three timers with the mapping in 10.2. Everything else in it stands, including the hot desk,
the scope rule and every global and task id.

### 13.4 The engine feedback plan (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`)

The capture log is being redesigned there to hold server-made link items and remote sessions. What
this slice makes, stated so that design can rely on it:

1. **The link item** has exactly the shape in 4.1: `type: "network_link"`, a stable `id`
   (`netlink_<footholdId>`), `footholdId`, `sourceId`, `name`, `sprite`, `observations`,
   `takeable: false`, no `contents`, no `hasContents`, no `droppable`. It is built by the server,
   not copied from an authored item.
2. **Filing.** The log files an item by a `storeIn` field. A link item carries `storeIn` when its
   jack sets `linkStoreIn`, copied by the server at the plant. With no holder in the inventory the
   item takes a tray slot, as that plan already says for any stored item.
3. **Arrival and removal.** It arrives in the `inventory` array of the plant's answer and in
   `playerInventory` on load, never through `addToInventory`'s request; it leaves when an answer's
   inventory no longer holds it. `showServerItem` and `syncInventoryFromServer` (step 7) are the
   two functions that do this, and they go through whatever "show in tray or store in holder" hook
   `inventory.js` has at the time.
4. **Opening.** A link item's own click is its opener: `handleObjectInteraction` on it calls
   `window.networkLinks.open(footholdId)`. In the log it belongs with sessions, as an entry that
   opens the network view in place of the container minigame; closing the view should return to
   the log when it was opened from there (`open(footholdId, { returnTo })`).
5. **The menu.** In the inventory click menu a `network_link` has one entry, "Open", so it acts on
   a single click. Its `observations` are shown in the view's header, so no "Examine" is needed.
6. **Remote sessions are not items.** A remote session is a server record. The log can list them
   from `window.pcSessions.list()` (entries with `remote: true`, `footholdId`, `pcId`,
   `displayName`) and open one with `window.networkLinks.openSession(pcId)`, which this slice
   provides in step 7.
7. **Captured sign-ins** reads `readCaptures` and the `/capture_secrets` answer. If that plan moves
   the row renderer or narrows which entries `/capture_secrets` answers, the list follows: it shows
   only targets in `accounts` whatever else changes.
8. **Findings.** A plant files nothing by itself. A scenario that wants a finding adds a capture
   from a mapping on `network_device_planted`, as the lab does.

9.3a works with none of that plan built: link items sit in the tray, and the jack click needs only
`window.gameConfirm`.

## 14. Build streams and shared files (9.3a)

Streams by file ownership inside this slice:

| Stream | Steps | Owns | Starts |
|---|---|---|---|
| S, server | 1, 2, 3, 4 | `lib/break_escape/network_model.rb`, `app/models/break_escape/network_access.rb`, the hooks in `game.rb`, `games_controller.rb`, `config/routes.rb`, `test/unit/network_model_test.rb`, `test/models/**/network_*`, `test/controllers/**/network_*`, `test/support/network_model_scenario.rb` | At once |
| T, tooling and authoring | 5, 6 | `scripts/validate_network.rb`, the hooks in `scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `scripts/generate_dungeon_graph.rb`, `README_scenario_design.md`, `tools/playtest/**`, `systems/test-bridge/access.js`, `docs/test-bridge.md`, the playtest skill's paragraph, and their tests | When step 1's `network_model.rb` is committed (the validator requires it) |
| C1, client footholds | 7 (client files) | `systems/network-links.js`, `api-client.js`, `systems/inventory.js`, `systems/interactions.js`, `core/game.js`, `systems/objectives-manager.js`, and their tests | At once, against the route shapes in sections 5 and 6 (node tests stub the API); browser checks when step 3 is in |
| C2, client view and remote sign-in | 8 | `minigames/network-view/**`, `minigames/index.js`, `systems/unlock-system.js`, `systems/pc-sessions.js`, `minigames/container/container-minigame.js`, `minigames/password/password-minigame.js`, and their tests | The view at once, against section 6's answer; the rest when C1's `network-links.js` and step 4 are committed |
| F, feature scenario | 7 (scenario), then the runs of 7 and 8 | `scenarios/test_access_networks/**` | When stream T's validator is committed |
| L, lab | 9 | `scenarios/lab_physical_pentest/**`, `lab_physical_pentest_secrets_test.rb` | Section 10.4 |

Inside this slice no file is in two streams. `inventory.js` belongs to C1 alone, including the one
parameter step 8's shares need, which is why step 7 adds it.

**Files other plans also edit.** One plan at a time holds each of these; a builder re-reads the
file just before editing, edits only its own block, never reformats, and commits with explicit
paths. With the build order 9.3a, 9.1, 9.2, this slice's edits come first among the slices. The
engine feedback streams (E1 to E4 in that plan) are a separate build that may run at the same
time; the last column gives the sequence against them.

| File | Also edited by | Sequence |
|---|---|---|
| `systems/inventory.js` | Engine E3 (the click menu, the tray hook), 9.2 | E3 first if it has started: C1 then adds its two exports on top of E3's tray hook. If E3 has not started, C1 goes first and E3 re-reads |
| `systems/interactions.js` | Engine E3, 9.2 (the `requiresItem` plant) | The same rule as `inventory.js`. C1's edit is two branches after the sign-in branch |
| `systems/unlock-system.js` | Engine E1, 9.1 stream A, 9.2 stream H-4 | E1 first if it has started; then C2; then 9.1 and 9.2 |
| `systems/door-gates.js`, `systems/doors.js` | Engine E1, 9.1 stream D | Not edited by this slice |
| `systems/pc-sessions.js`, `api-client.js`, `core/game.js` | 9.1 stream A, 9.2 | This slice first |
| `minigames/password/password-minigame.js`, `minigames/container/container-minigame.js` | None named today | C2 |
| `systems/apply-actions.js`, `systems/minigame-registry.js` | Engine E4 | Not edited by 9.3a (9.3b's implants add one case to `apply-actions.js`, after E4) |
| `app/models/break_escape/game.rb` | Engine E3 (`add_item_to_room!`), E4 (`capture_secrets_for_client`), 9.1, 9.2 | Different methods. This slice does not edit either engine method: `accounts` is composed in the concern and added in the controller action |
| `games_controller.rb`, `config/routes.rb` | 9.1 (`login_accounts`), 9.2 (routes, `claim: "guest"` in `login`) | This slice first. Its `login` edit refuses every claim that carries a foothold, so 9.2's new claim needs no change here |
| `scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `README_scenario_design.md` | Engine E1, E3, E4, E5; 9.1; 9.2 | Each adds its own block. If engine streams run at the same time, E3 edits first, as that plan says, then stream T |
| `scripts/generate_dungeon_graph.rb` | 9.1 stream B, 9.2 | This slice first |
| `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/verify-run.rb`, `tools/playtest/access-leak-check.rb` | Engine E4, 9.1 stream E, 9.2 | Engine E4's edit is to `access-leak-check.rb` only; stream T edits the two library files. Then 9.1, then 9.2 |
| `systems/test-bridge/access.js`, `docs/test-bridge.md`, the playtest harness | Engine E3 (`docs/test-bridge.md`, the harness), 9.2 | Stream T adds only the `access` block and its paragraph; E3 owns the rest |
| The no-password test, `access_model_withholding_test.rb` | 9.1, 9.2 | This slice adds its own test files and does not edit these |
| `scenarios/lab_physical_pentest/**`, `lab_physical_pentest_secrets_test.rb` | The content plan, the engine plan's lab wiring, 9.1's lab step | Section 10.4: content plan, then this slice, then 9.1 |

Review and playtests follow `AGENTS.md`: adversarial review rounds of this plan before any build,
an implementation review after each stream, and the scripted runs listed in the steps.

## 15. Decisions

Decided items are written as decided; the plan is built on them. Open items carry a
recommendation, and the plan is written as if it is taken.

| # | Question | Decision or recommendation | Status |
|---|---|---|---|
| 1 | Split and order | The slice is split. 9.3a (the drop box's needs: a device in a jack, the link item, the view, remote sign-in, shares, secrecy and tooling) is built first of all the later slices, then 9.1, then 9.2. 9.3b holds links with a pivot, outages, Wi-Fi, port security and implants | Decided (orchestrator, under the user's latitude) |
| 2 | Is remote sign-in on by default? | On for every sign-in host on a foothold's network unless its policy says `remote: "blocked"`. The validator's "doors skipped" is a **warning** until the author writes `remote` out in the PC's policy | Decided (orchestrator, under the user's latitude) |
| 3 | Reach across a link | Never free. A foothold reaches its own network; a linked network is reached through a session the player holds on a host that reaches it (12.1) | Decided (orchestrator, under the user's latitude) |
| 4 | Implants | In 9.3b, and only in a form that ends in something the server checks: an implant gives a foothold and no session, needs the server's record of the drop, and the account still needs its password (12.5) | Decided (orchestrator, under the user's latitude) |
| 5 | The lab | The aim stands: plant the box, see what is exposed, reach something with a captured password. The payoff is the door controller, which needs the box and Chris's password; client records stay out of scope; this slice's mechanism replaces the content plan's hand-built console and admin page (section 10) | Decided (orchestrator, under the user's latitude) |
| 6 | Art | Reuse existing art: a link item shows the planted device's own sprite, a planted jack `pi_cluster1`, a Wi-Fi link (9.3b) the access point's own sprite. The phone icon is not used for any link | Decided (orchestrator, under the user's latitude) |
| 7 | How does a share with an access list open? | Only from the desktop of an account that may use it, as a mapped drive. One sign-in mechanic, and it shows that shares follow the account | Recommended |
| 8 | Can the player take a planted device back? | Yes. An unplug ends the sessions that still depend on it, prevents a soft lock with one box and two jacks, and "collect your kit" is good practice to teach | Recommended |
| 9 | Hosts with no screen (`headless`) | Include in 9.3a. It is one field, it is what makes a chain need the foothold, and the lab's payoff rests on it | Recommended |
| 10 | Does the view open by itself after the first plant at a jack? | Yes. The user asked to see what is exposed; a new tray icon alone is easy to miss | Recommended |
| 11 | Resource names in an NPC's `work` plan (slice 9.2) | Accept. A name and a global name are not what this slice protects; hosts, contents and access lists stay behind a foothold or session | Recommended |
| 12 | Wi-Fi with no device and no range; a down network shown as "no route" with rows kept for held sessions (both 9.3b) | As written in 12.2 and 12.3 | Recommended, to be confirmed when 9.3b is planned in full |

## 16. Left out, on purpose

- **Per-service rules, firewall objects, one-way links.** A link exists or it does not, and a pivot
  crosses it.
- **Wi-Fi range and client devices.**
- **`requiresReach`** on objects and VM launchers, and with it the bridge to SecGen VMs. When it is
  wanted, the server-side question "does the player reach network N" is `player_reach` for any held
  foothold, and the client-side list is in `network-links.js`.
- **Opening a share by typing credentials** in the network view (decision 7).
- **Detection.** NPCs noticing a planted device, an alarm on failed remote sign-ins, and logs for a
  defender mission. The events of 3.5 are the hooks.
- **A bypass for port security.**
- **Plain workstations and legacy password PCs as hosts.** Only `lockType: "login"` objects are
  listed. A scenario that wants a PC on the network makes it a sign-in PC.
- **An implant that hands over a session.** 12.5 says how to build that effect from checked pieces.
- **NPC behaviour of any kind.** That is slices 9.1 and 9.2.

## 17. Declined

Suggestions considered and not taken, each with its reason.

- **A server pause after repeated wrong Wi-Fi keys.** It needs a counter, a clock and a new saved
  key for an attack only a scripted client makes, against a key the author chooses. The validator
  warns about a short key instead, and 12.3 states the strength.
- **A two-choice prompt (Open or Unplug) on a planted jack.** No such component exists and the
  inventory menu that could host it belongs to another plan that may not be built yet. The jack
  asks one OK or Cancel question (unplug); the view opens from the link item.
- **A `first` flag on `network_viewed`.** A flag kept per page would be true again after every
  reload, and a saved one needs a write from a read route. `onceOnly` on the mapping already does
  the job and is saved; the plant's answer carries its own `first` from `gainedFootholds`.
- **Reading `rogueDevice` from the server's stored inventory copy.** The stored copy is the
  scenario's for most items but can be the client's fields when the add had no scenario source. The
  flag is read from the scenario definition, in the five homes of 3.3, each with a test.
- **Refetching the view on global changes, or carrying an outage hash in its answer.** 9.3a has no
  outages, so the view refetches only when opened or returned to; 9.3b uses a five second timer
  while open (12.2).
- **A reachability test added to every route that uses a session.** Rooms do not relock and an
  unplug deletes the sessions it carried, so "a session exists" is already enough in 9.3a; only the
  desktop request is judged on how the player gets there. 9.3b adds the route test where outages
  make it matter (12.2).
- **Filing a finding automatically at a plant.** What a plant proves is the scenario's to say; a
  mapping on `network_device_planted` adds the capture, as the lab's already does.
- **Registering the view in `systems/minigame-registry.js`.** That table maps object types, ink
  tags and `openMinigame` mappings to starters. Nothing opens the view by those routes; its scene
  is registered in `minigames/index.js` with the other scenes.
