# Access model slice 9.3b: links, outages, Wi-Fi, port security, implants

Status: **design, 2026-11-11, build-ready.** It builds on slice 9.3a (links, remote sign-in,
shares, the network view), which is built and on `main`, and is the second half of the networks
slice first sketched in section 12 of `ACCESS_MODEL_SLICE_9_3_PLAN.md`. This plan is standalone: a
builder can follow it without reading that plan, its reviews or any other. Claims about existing
code were checked against the worktree at branch `build/9-3b-plan` (from `main`); method names are
the stable reference, line numbers move.

This slice adds five game-world simulation features, each a set of scenario fields, server checks
and client rendering, in the same shape 9.3a uses: links between in-game networks crossed by a
pivot through a held session; network outages driven by a global; an in-game Wi-Fi model; port
security on in-game switches; and planted devices ("implants") as game items. None of it is a
real-world attack or exploitation procedure: everything here is a game rule the server enforces
and the browser draws.

How to read this plan: section 1 says what the slice adds and why; section 2 what the code does
today; section 3 the sub-slices in build order, each ending playable and tested; section 4 the
scenario fields; section 5 the engine behaviour; section 6 every server route with its checks;
section 7 what reaches the browser and what never does; section 8 state and saved games; section 9
the validator, schema and dungeon graph; section 10 the effect on existing scenarios; section 11
the tests and the feature scenario; section 12 the build steps with the ownership and order table;
section 13 the open questions for the user.

## 1. What this slice adds, and why now

Slice 9.3a made one chain buildable: plant a rogue device in a network jack, see what the network
exposes, and reach a listed host or share with a password captured somewhere else. A foothold in
9.3a reaches **its own network and nothing else**, and a sign-in host or share is reached only on
that one network. This slice adds the next five pieces the networks design named, each one more
thing a scenario author can model and each one still ending in something the server checks.

1. **Links and the pivot.** Two in-game networks can be joined by a link. A rogue device is not a
   member of the linked network, so a foothold still reaches only its own network; the linked
   network is reached only by pivoting through a host the player has a **session** on, and that
   session rests on a password the server checked. This is the segmentation lesson in one rule.
2. **Outages.** A network (or a resource) can be marked down while a named global is truthy. While
   it is down its hosts leave the view, its desktops and shares are not served, and a session
   reached through it is kept but shown as "no route" until the route returns. An outage paces a
   puzzle and models a real failure; it never protects a secret on its own.
3. **Wi-Fi.** A network can carry an SSID and a pre-shared key. An access point object asks for the
   key in the password minigame; the server compares it and grants a foothold on that network. No
   device and no range: the server could not check range.
4. **Port security.** A jack can refuse an unknown device: the device goes in, no foothold is
   given, and it stays in the inventory. It shows the fix the lab's own text names (disable unused
   ports). It only refuses; a bypass is not part of this slice.
5. **Implants.** A foothold given by a device plugged into a **PC** rather than a jack: a member of
   staff plugs in a device the player dropped, or the player plugs a keystroke-injection device
   into a PC they are already signed in to. An implant gives a foothold and nothing else: no
   session, no desktop, no owner's access. The account still needs its password through the
   ordinary remote sign-in.

**Two rules the whole design keeps, from 9.3a.**

- **A step that must not be skipped ends in something the server checks.** A plant, a Wi-Fi join
  and an implant are checked against the server's own records; a sign-in against the password on
  the server; a pivot against a held session that rests on a checked password. Anything the browser
  merely claims (a global, a capture entry) can pace a puzzle and fill in a form, and can never be
  the only thing between the player and a secret.
- **A captured password is a key because the server checks it, not because the player holds a
  capture.** The captured-sign-ins list on the remote screen only types for the player what they
  could type themselves; the gate is the server's password check.

Design principles, as in 9.3a: chaining is the point; fun and educational, not hard; simple enough
for a pixel art game; and the server decides reach, so nothing a network exposes reaches the
browser before the server holds a foothold or session that reaches it.

## 2. What the code does today (verified)

9.3a is built. This slice stands on it and extends it in place. The table is the state as this
plan found it; the method names are what to extend.

| Area | Today | Where |
|---|---|---|
| The shared model | `BreakEscape::NetworkModel` (plain Ruby, shared by the server, the validator and the dungeon graph) answers `networks`, `resources`, `network_of(object, room)`, `jacks`, `sign_in_objects_on(network, data)`, `resources_on(network, data)`, `rogue_device_definitions`, and `reach_conditions(data, station_network, resource)`. `reach_conditions` **ignores `data`** and answers `[[]]` (one route, no conditions) when the resource has no network or is on the station's own network, `[]` (no route) otherwise. There is no link, outage or Wi-Fi code | `lib/break_escape/network_model.rb` |
| Footholds | `player_state['footholds']` is `{ footholdId => { via, network, source, device, seq } }`; `gainedFootholds` is the list of every source a foothold was ever gained from. `foothold_id_for(jack_id)` is `"jack_#{jack_id}"`. Both keys are in `Game::ACCESS_STATE_DEFAULTS`, so a reset drops them and a game from before 9.3a reads them as empty | `app/models/break_escape/network_access.rb`; `game.rb` (`ACCESS_STATE_DEFAULTS`) |
| Reach | `host_reachable_through?(foothold_id, pc)` is true when the foothold is held, the target is a sign-in object, and `object_network(pc)` equals the foothold's network. `resource_admits_player?(resource)` is true when a held foothold is on the resource's network (open share) or a session the player holds is at a PC on the resource's network and the list admits it. `mapped_shares(pc, npc)` lists the file shares on `object_network(pc)` the session's identity may use. All compare one network id for equality; none follows a link | `network_access.rb` |
| The view | `network_view(foothold_id)` answers `{ footholds: [ { id, via, name, network, hosts } ] }`; `network_rows(network)` is the sign-in hosts then the resources of **that one network**, each sorted by id. `host_row` and `resource_row` build the rows. There is no second block for a linked network | `network_access.rb` |
| Remote sign-in | `attempt_login!(pc_id, username, password, foothold:)` runs the host-reachable, remote-not-blocked, lockout, password and access checks and, on success, writes `sessions[pcId] = { id, via: 'password', foothold }`. `claim_login_session!(pc_id, globals, foothold:)` refuses any claim that carries a foothold | `game.rb` (`attempt_login!` :1521, `claim_login_session!` :1563) |
| The desktop | `desktop_request_allowed?(info, foothold_id)` is the one place a desktop request is judged: with a foothold, the host is reachable through it, remote sign-in is not blocked and the session is not a claim, and the room is not consulted; without, the PC is physically reachable and not headless. `settle_session_at_keyboard!(pc_id)` clears a session's `foothold` when its desktop is served at the keyboard. The **scoped** requests under a desktop (a folder's `GET /container`, the inventory add, an `unlock`) ask only that a session exists which admits the object; they do not re-check reach | `network_access.rb`; `games_controller.rb` |
| The policy | `effective_policy(pc)` reads `pc['policy']` (else `scenario_data['defaultPolicy']`) from `scenario_data['policies']`. `remote_blocked?(pc)` is `effective_policy(pc)['remote'] == 'blocked'`. `login_max_attempts(pc)` reads `maxAttempts`. There is no `usb` field read here yet | `game.rb` |
| Rogue devices | `held_rogue_device(device_id)` finds the first rogue device the server inventory holds, reading `rogueDevice: true` from the scenario definition. `plant_device!` and `unplug_device!` are the plant and unplug. `planted_device?(item)` and `hide_planted_devices!` keep one device one device | `network_access.rb` |
| Declared grants and drops | `DeclaredGrants.for(data)` walks the scenario's declared grants (timers and the like); `held_grant_items` is those the inventory holds. `add_item_to_room!` writes a grow-only `player_state['droppedItems']` list of item ids the player dropped (built for the engine plan's capture proofs); `capture_proofs.rb` already reads it | `lib/break_escape/declared_grants.rb`; `game.rb` (`add_item_to_room!` :460); `capture_proofs.rb` |
| The client's networks module | `systems/network-links.js` (`window.networkLinks`) is the only place the client asks about networks. It keeps the foothold list, the "gained" set, the last view per foothold, and the **trip** (the way back, a record and a landing table `LANDINGS` for `view`, `signin`, `desktop` and `share`). `interactJack`, `plant`, `unplug`, `open(footholdId, { returnTo })`, `openSession(pcId, { returnTo })`, `view(footholdId)`, `resume`, `leave`, `landed`. It looks the view and remote-desktop starters up on `window`, so the minigame files add them with no edit here | `public/break_escape/js/systems/network-links.js` |
| The view minigame | `minigames/network-view/network-view-minigame.js` renders one `GET /network` foothold entry: host rows (`hostAction`: off, open, sign-in) and resource rows (`resourceAction`: open, locked, observe). It reports its exit reason through `networkLinks.landed('view', reason)`. Rows carry `data-host-id`, `data-resource-id`, `data-action`. It never reads scenario data and has a single flat list of rows | `network-view-minigame.js` |
| Reserved fields | The 9.3a validator **refuses**, each with "needs slice 9.3b": top-level `networkLinks`; `downIf` and `wifi` on a network; `wifiAp`, `portSecurity` and `portSecurityMessage` on an object; and any `grant_foothold` action anywhere. The schema carries each as a reserved stub | `scripts/validate_network.rb` (:15-72); `scripts/scenario-schema.json` (:209, :220, :5288) |
| Resources' `downIf` | The schema already describes `resources.<id>.downIf` as slice 9.2's ("a global name; the resource is down while it is truthy"). 9.2 owns the NPC side of a resource outage; the player side is this slice's | `scenario-schema.json` (:238) |
| 9.2's USB policy | Slice 9.2's sub-slice U (the `usb` policy field, `usbClass` on items, `usbRefused`) is designed and built on a branch but is not assumed present in `main` here. The implant's USB check is written as a hook that whichever of 9.2's sub-slice U and this slice lands second installs | `ACCESS_MODEL_SLICE_9_2_PLAN.md` sub-slice U; section 5.5 below |

Nothing in this table rolls dice. Reach in 9.3a is a pure function of the scenario and the
footholds and sessions held; this slice keeps that (section 5.6).

## 3. Sub-slices in build order

Build in this order. Each sub-slice is playable and tested on its own before the next, and each
stands on 9.3a and the sub-slices before it. The letters avoid 9.1's (A to E), 9.2's (U, A, B, H,
L, C) and 9.3a's step numbers.

| Sub-slice | What it adds | Ends playable when | Feature beats (section 11) |
|---|---|---|---|
| **K. Links and the pivot** (first) | `networkLinks`; `reach_from`/`player_reach`; the view's linked-network block; the pivot through a held session | A foothold on one network shows a second network only after a remote sign-in at a host that bridges the two, and a host on the second network can be signed in to in turn | N1 to N4 |
| **O. Outages** | `downIf` on a network (the player side of a resource `downIf` too); `truthy?`; hosts and shares withheld while down; "no route" rows; the scoped-request route test | A network down by default is unreachable until an object sets its global false; a held session over a route that goes down shows "no route" and opens again when it returns | N5 to N7 |
| **W. Wi-Fi** | `networks.<id>.wifi = { ssid, psk }`; `wifiAp` on an object; `POST /network/join`; the `wifi_<id>` foothold | Clicking an access point asks for the key; the right key grants a foothold whose view lists that network | N8, N9 |
| **P. Port security** | `portSecurity` and `portSecurityMessage` on a jack; the refusal | A jack with port security takes the device in, gives no foothold, keeps the device, and shows its message | N10 |
| **I. Implants** | the `grant_foothold` action; `POST /network/implant`; the dropped-device and BadUSB triggers; the USB-policy hook | A device the player dropped and an NPC uses, or a BadUSB the player plugs into a PC they hold a session on, grants a foothold and nothing else | N11, N12 |

The order matters: K defines the reach model the view and the outage logic both extend; O adds the
runtime "is this route up" test that K's reach uses; W and I are two more foothold kinds that reuse
K's view and reach; P is a refusal on the plant path and is independent but small, so it sits after
W. Each sub-slice ends with its feature-scenario beats added to `test_access_networks` (built now
by 9.3a) and its unit, Rails and node tests green, plus a scripted browser run of its beats.

## 4. Scenario fields

This slice un-reserves the fields 9.3a holds and adds a small number of new ones. One worked
example first; the subsections say what each part means.

```jsonc
{
  "networks": {
    "office_lan": { "name": "Harbour office LAN" },
    "server_net": { "name": "Server network", "downIf": "servers_offline" },
    "guest_wifi": { "name": "Guest Wi-Fi", "wifi": { "ssid": "Harbour-Guest", "psk": "seabreeze-2025" } }
  },

  "networkLinks": [
    [ "office_lan", "server_net" ]
  ],

  "globalVariables": {
    "servers_offline": true
  },

  "resources": {
    "backup_vault": { "kind": "file_share", "name": "Backup-Vault", "host": "SV-FS02",
                      "network": "server_net", "access": { "roles": ["it"] },
                      "contents": [ /* ... */ ] }
  },

  "rooms": {
    "lobby": {
      "objects": [
        { "id": "guest_ap", "type": "pc", "sprite": "wifi_ap1", "name": "Guest access point",
          "wifiAp": true, "network": "guest_wifi" },
        { "id": "secure_port", "type": "pc", "sprite": "network_rack1", "name": "Locked switch port",
          "networkJack": true, "network": "server_net",
          "portSecurity": true,
          "portSecurityMessage": "The switch logs the device's address and shuts the port. It takes only known machines." }
      ]
    },
    "hot_desk_room": {
      "objects": [
        { "id": "hot_desk_pc", "type": "pc", "name": "Hot desk PC", "host": "HB-HOT-01",
          "network": "office_lan", "locked": true, "lockType": "login", "access": { "roles": ["staff"] } }
      ]
    }
  },

  "timers": [
    { "id": "staff_uses_stick", "triggerEvent": "...", "actions": [
      { "type": "grant_foothold", "pc": "hot_desk_pc", "needsDropped": "kit_usb_stick",
        "name": "USB foothold: hot desk" }
    ] }
  ]
}
```

### 4.1 Links

- `networkLinks` is a list of two-item lists of network ids. A link is **undirected** and says
  that members of one network can reach the other. A link whose ids are not both defined networks
  is a validator error.
- A rogue device's foothold is **not a member**. A foothold gained at a jack still reaches only its
  own network. The linked network is reached only by pivoting through a session (section 5.1).
- A host has one `network` in this slice, as in 9.3a. The real "only named jump hosts reach the
  server network" control would need a list of networks on a host; the model is written against
  "the networks of an object" so a later slice can add that without changing callers, but the
  schema keeps a single string here.

### 4.2 Outages

- `networks.<id>.downIf` names a global. While that global is truthy (section 5.2) the network is
  down: members and pivots do not reach through it, its hosts leave the view, and its desktops and
  shares are not served.
- `resources.<id>.downIf` is slice 9.2's field (it names the global that takes the resource's own
  service down). This slice reads it for the player side: a resource whose own `downIf` is truthy
  is not served and its row is shown down, exactly as a resource on a down network is.
- The global is an ordinary scenario global, declared in `globalVariables` with its starting value.
  A network "down by default" sets its global true there; an object that repairs it sets it false.
  An undeclared `downIf` global is a validator warning (section 9).

### 4.3 Wi-Fi

- `networks.<id>.wifi = { ssid, psk }` lives on the network and nowhere else, in a block that never
  ships to the browser. `psk` absent means an open network.
- An access point is any room object with `"wifiAp": true` on such a network (its own `network`, or
  its room's default). Several access points may serve one network.
- A Wi-Fi key is a lock secret like a door PIN, not an account password, so ink may name it. The
  validator warns when a key appears nowhere the player can read, and when a key is shorter than
  eight characters.

### 4.4 Port security

- `"portSecurity": true` on a jack, with an optional `"portSecurityMessage"`. The device goes in,
  the switch refuses an unknown device, no foothold is given, and the device stays in the
  inventory. The message is shown to the player; without it a default is used.
- A jack cannot be both `portSecurity: true` and a Wi-Fi access point, and `portSecurity` is only
  valid on a `networkJack` (section 9).

### 4.5 Implants

- A `grant_foothold` action, on a path the engine runs actions from and the server's declared-grant
  walk covers (a `timers` entry, an NPC `eventMapping` that runs actions, a `confirm_action`'s
  `onConfirm`). Two shapes:
  - `{ "type": "grant_foothold", "pc": "<pc id>", "needsDropped": "<item id>", "name": "..." }`: an
    NPC uses a device the player dropped. The foothold is granted when the action fires **and** the
    server's own `droppedItems` record shows that item was dropped.
  - `{ "type": "grant_foothold", "pc": "<pc id>", "needsSession": true, "needsHeld": "<item id>",
    "name": "..." }`: the player plugs a device into a PC they already hold a session on (a claim or
    a password sign-in, not through a foothold). The foothold is granted when the server holds that
    session and the inventory holds `needsHeld`, which the implant then takes out of the inventory
    as a plant does.
- An implant gives a foothold on the **PC's own network** and nothing else. The validator errors on
  a `grant_foothold` under `flagRewards` (the flag station runs actions in the browser, off the
  server's list) or an `eventMappings` entry the server does not run as an action, on one with
  neither `needsDropped` nor `needsSession`, and on one with both.

### 4.6 Which fields ship

As in 9.3a, the bootstrap deletes `networks`, `networkLinks` and `resources` whole, so no network
name, link, SSID, key, resource name, `host`, `observations` or share content ships. The only new
fields that ship, on room objects, are `wifiAp` (so the client knows a click is a join) and
`portSecurity`/`portSecurityMessage` (so a refusal can be drawn). A `grant_foothold` action's own
`name` ships as any action's fields do; it is a link-item label, not a secret.

## 5. Engine behaviour

### 5.1 Links and the pivot (sub-slice K)

**The model (`NetworkModel`, shared).**

- `network_links(data)` normalises `networkLinks` to a list of `[a, b]` pairs of defined network
  ids, dropping malformed entries.
- `linked_networks(data, network)` is the networks directly joined to `network` by a link
  (undirected).
- `reach_paths(data, from, to)` is every simple path of network ids from `from` to `to` over the
  link graph, shortest first, capped at eight; the cap is the validator's warning threshold
  (section 9). This is a pure graph walk: it does not read outages.
- `reach_conditions(data, station_network, resource)` keeps its 9.3a return shape (a list of
  routes, each a list of condition globals) and is extended to use `reach_paths`: for a resource on
  a network reachable from `station_network`, each route is the `downIf` globals of the networks on
  its path (the station's and every intermediate and the resource's network), **not** the
  resource's own `downIf` (that is 9.2's and 9.2 adds it to its own route list). A resource on the
  station's own network is still `[[]]`; an unreachable one is still `[]`. This is the function
  slice 9.2's NPC-work composer already calls; its output gains the path globals, which 9.2's
  `npc-work.js` evaluates on the browser (section 12 notes the shared ordering).

**The runtime reach (`NetworkAccess`, server).**

- `network_up?(network_id)` reads the network's `downIf` global from
  `player_state['globalVariables']`, falling back to the scenario's declared default, and answers
  false when that value is truthy by `NetworkModel.truthy?` (section 5.2). A network with no
  `downIf` is always up.
- `reach_from(network_id)` is the set of network ids reachable from `network_id` by following links
  through **up** networks only (a breadth-first walk using `network_up?` and `linked_networks`),
  the start network included when it is itself up.
- `player_reach(foothold_id)` grows the foothold's reach by the pivot rule: start with
  `reach_from(the foothold's own network)`; then, repeatedly, for every sign-in host on a network
  already in the set at which the player holds **any** session (a claim or a password sign-in,
  however it was opened, so sitting down at a pivot host, which clears the session's `foothold` in
  9.3a, does not cut the pivot), add `reach_from(that host's network)`; stop at a fixpoint. The
  result is the set of network ids the foothold reaches now.
- `host_reachable_through?(foothold_id, pc)` is extended: the foothold is held, the target is a
  sign-in object, and its network is in `player_reach(foothold_id)`.
- `resource_admits_player?(resource)` is extended: a held foothold reaches the resource's network
  (it is in that foothold's `player_reach`) and, for a share with an access list, a session the
  player holds is at a host whose network reaches the resource's network (through `reach_from`) and
  the list admits that session's identity. An open share (no access list) is still reached by any
  held foothold that reaches its network.
- `mapped_shares(pc, npc)` is extended: every `file_share` on a network in `reach_from(the PC's
  own network)` whose list admits the session's identity, so a finance PC maps a share on a linked
  server network for the player exactly as it does for the member of staff.

**The view's linked-network block.** `network_view` gains, per foothold, a `networks` block: an
entry per network the foothold reaches, each `{ id, name, via: { hostId, host, displayName } |
null, hosts }`. The foothold's own network has `via: null`; a network reached through a pivot names
the host and session it was reached through. `hosts` is the sign-in hosts and resources of that
network, built by the existing `network_rows`. The client renders the own-network rows first, then
a labelled block per linked network ("Server network, through HB-FIN-02, signed in as Lena Fox").
The 9.3a flat `hosts` array stays for the foothold's own network so existing tests and clients
read it unchanged; the `networks` block is additive.

**Client (`network-view-minigame.js`).** The view renders the extra `networks` blocks under the
own-network rows, each with a header line and the same row widgets (`host_row`, `resource_row`
already carry what it needs). Signing in at a pivot-network host, or signing out of the pivot host,
makes the view refetch so the block appears or disappears. No new trip or landing: a pivot host's
sign-in screen and desktop are the same screens as any other host's, reached through the same
`open`/`openSession` trip.

### 5.2 Outages (sub-slice O)

- `NetworkModel.truthy?(value)` matches JavaScript's truthiness, because the browser decides the
  same question for 9.2's NPC work: false for `false`, `nil`, `0`, `0.0`, `""` and a missing key;
  true for everything else, the string `"false"` included. It is tested with each of those.
- `network_up?` and a resource's own-`downIf` test both read the global from
  `player_state['globalVariables']`, falling back to the scenario's declared default in
  `globalVariables`, and apply `truthy?`.
- **What is withheld while down.** `player_reach` and `reach_from` already skip a down network, so
  its hosts and shares drop out of the view and out of `mapped_shares`, and `host_reachable_through?`
  and `resource_admits_player?` refuse them. A `GET /container` for a host or share on a down
  network answers as 9.3a answers an unreachable one (403 `unreachable` for a sign-in host, the
  invented-id 404 for a resource).
- **A held session over a route that goes down.** The server keeps the session. In the view, a
  network reached through a pivot that is down shows as one greyed line, "<name>: no route", and
  under it each host at which the player holds a session through this foothold keeps a greyed row
  whose click says "No route to <host>", so a held session is never silently missing. The server
  answers that session's desktop request 403 `unreachable`; when the route returns it opens again
  with no password.
- **The scoped-request route test.** This is the one place 9.3a's "a session exists is enough" rule
  no longer holds, because an outage can take a route down without deleting the session. So in a
  scenario that defines any network `downIf`, the scoped requests under a remote desktop (a folder's
  `GET /container`, the inventory add from a desktop, an `unlock` inside a desktop) carry the
  foothold and are re-judged on the route: the server answers 403 `unreachable` (or the invented-id
  refusal for a share path) when the host or share is no longer reached. A local session at a PC on
  a network with no `downIf` is judged exactly as today, so no existing scenario gains a refusal.
- **Keeping the server's view current (client).** Before `GET /network`, a remote sign-in, and any
  desktop or share fetch while a foothold is held or the last desktop showed a mapped share, the
  client awaits `window.stateSync.sync()` so the server reads the latest outage globals. An open
  view refetches every five seconds; it does **not** refetch on every global change, because the
  needs and workstation layers publish globals continuously.

### 5.3 Wi-Fi (sub-slice W)

- `NetworkModel.wifi_aps(data)` is every room object with `wifiAp: true` on a network that defines
  a `wifi` block; `wifi_of(network)` is `{ ssid, psk }` or nil.
- Clicking an access point (a branch in `interactJack`'s sibling in `network-links.js`, keyed on
  `wifiAp`) asks for the key in the password minigame's key mode. `POST /network/join` compares the
  key on the server. The foothold is `wifi_<networkId>`, `via: "wifi"`, `source` the access point's
  object id, `network` the AP's network. Like a jack's foothold it reaches its own network only (and
  then pivots like any foothold, section 5.1).
- Joining through a **second** access point of a network already joined answers `already: true` and
  **still** adds that access point's id to `gainedFootholds` and emits `network_joined` for it, so a
  task or mapping on either access point completes.
- The link item's picture is the access point object's own sprite, never the phone's, so the tray
  does not hold two phone icons that open different things. The link item, the view and the trip are
  9.3a's, unchanged: a Wi-Fi foothold is a foothold.
- No device and no range. An open network (`psk` absent) joins with no key prompt. A wrong key is
  not counted (section 13 records the strength): the server just answers "wrong key".

### 5.4 Port security (sub-slice P)

- `plant_device!` gains one check, after "the jack exists" and "object reachable" and before it
  takes the device: when the jack has `portSecurity: true`, it does not plant. It leaves the device
  in the inventory, gives no foothold, and answers `{ success: false, reason: "port_security",
  message: <portSecurityMessage or a default> }`. The client shows the message and emits
  `network_device_refused` with reason `port_security`; the device is never removed.
- It only refuses. A bypass (an allow-list the device can be added to, a cloned address) is left
  out of this slice (section 13).

### 5.5 Implants (sub-slice I)

- A new route, `POST /network/implant`, and a new action handler for `grant_foothold` on the
  server's action path (`apply-actions` on the client, and the server's declared-grant walk for the
  dropped case). The action names a `pc`, a shape (`needsDropped` or `needsSession`+`needsHeld`) and
  a `name`.
- `implant_foothold!(pc_id, action)` requires, before it grants:
  1. the scenario declares a `grant_foothold` for that PC with the same shape (read from the
     scenario, never from the request);
  2. for `needsDropped`: `player_state['droppedItems']` holds the named item (the grow-only record
     `add_item_to_room!` writes). A drop's own room entry goes when the item is picked up again, so
     `droppedItems` is the durable proof, not the room entry;
  3. for `needsSession`: `sessions[pc]` holds a session the player has (a claim or a password
     sign-in, **not** one opened through a foothold) and the inventory holds `needsHeld`, which the
     implant then removes from the inventory as a plant does;
  4. where 9.2's USB policy is present, the PC's policy does not refuse the device's `usbClass`
     (the hook below). A device under a blocking USB policy fails **at the use**, not at the drop.
- On success it writes `footholds["implant_<pcId>"] = { via: "implant", network: <the PC's
  network>, source: pcId, device: <the needsHeld copy, when any>, seq }`, adds `pcId` to
  `gainedFootholds`, and adds the link item (its sprite the device's own, its name the action's
  `name`). The foothold reaches the PC's own network and pivots like any foothold. A repeat answers
  `already: true`.
- **It gives a foothold and nothing else.** No session, no desktop, no owner's access: the owner's
  desktop still needs the owner's password through the ordinary remote sign-in. The rogue USB beat
  becomes "the stick gives you the network; the keylogger or the phish gives you the account". The
  player's own BadUSB beat needs a session at the PC first, so it turns one desk into a way onto the
  network and still opens no other account.
- **Strength.** The rogue-USB trigger (the NPC's use) is reported by the browser, so that implant is
  weaker than a plant and is graded so; what it yields is bounded (a list of hosts, every one of
  which still asks for a password the server checks), which is why it may be client-triggered. The
  BadUSB trigger rests on the server's session and inventory records, as strong as a plant.
- **The USB hook.** `usb_refused?(pc, item)` sits beside `effective_policy` and reads 9.2's `usb`
  policy and the item's `usbClass`. Whichever of 9.2's sub-slice U and this slice lands second adds
  the method and the implant's call to it; until both are present the implant does not consult a USB
  policy. The validator warns for a `grant_foothold` whose PC would refuse its own device.

### 5.6 Determinism

Nothing in this slice rolls. Links, outages (a pure function of the globals held), Wi-Fi (a key
compared on the server), port security (a scenario flag) and implants (the server's drop and
session records) are all pure functions of the scenario and the state the server holds.

## 6. Server routes

Every route this slice adds or changes, with its checks in the order they run. A failed check stops
the request. Status codes follow 9.3a's: 404 for an unknown target, 403 for one that cannot be
reached, 422 for a refusal the player caused, and the invented-id answer wherever a refusal must
look like an unknown id. "Locked" means the route joins the `with_game_lock` list.

The two new routes sit in the routes' member block beside 9.3a's three, each with a policy method
that answers as `show?` does (`network_join?`, `network_implant?`), or `authorize @game` raises:

```ruby
post 'network/join',    to: 'games#network_join',    as: 'network_join'
post 'network/implant', to: 'games#network_implant', as: 'network_implant'
```

| Route | Parameters | Checks, in order | Writes and answer |
|---|---|---|---|
| `GET /network` (changed) | optional `foothold` | The game's own authorisation; an unknown foothold id is 404, as today | Per foothold, 9.3a's `{ id, via, name, network, hosts }` for the own network, **plus** `networks: [{ id, name, via, hosts }]` for every network the foothold reaches now (section 5.1), down networks shown as a greyed block with the held-session rows kept (section 5.2) |
| `POST /network/plant` (changed, locked) | `jack_id`, optional `device_id` | 9.3a's checks, plus: when the jack sets `portSecurity: true`, after "object reachable" and before the device is taken, refuse | Port security: 422 `{ success: false, reason: "port_security", message }`, the device left in the inventory, no foothold. Otherwise 9.3a's writes and answer |
| `POST /network/join` (new, locked) | `ap_id`, `key` (absent for an open network) | 1. The access point exists: a room object with `wifiAp: true` on a network that defines `wifi`; else 404 "Access point not found". 2. Object reachable; else 403 `unreachable`. 3. A foothold `wifi_<networkId>` is already held: answer `already: true`, add `ap_id` to `gainedFootholds`, emit `network_joined`, write nothing else. 4. The network has a `psk`: the key matches; else 422 `reason: "wrong_key"`, no count. An open network skips check 4 | Success: `footholds["wifi_<networkId>"]` written, `ap_id` added to `gainedFootholds`, the link item added. Answer `{ success, foothold, inventory, first }`, the shape of a plant's answer |
| `POST /network/implant` (new, locked) | `pc_id`, `shape` (`dropped` or `session`), the action's own fields from the scenario | 1. The scenario declares a matching `grant_foothold` for `pc_id`; else 404. 2. The shape's precondition (section 5.5): `droppedItems` holds the item, or the session is held and `needsHeld` is in the inventory. 3. The USB hook, where present. 4. A foothold `implant_<pcId>` is already held: `already: true` | Success: `footholds["implant_<pcId>"]` written, `pcId` added to `gainedFootholds`, `needsHeld` removed (session shape), the link item added. Answer `{ success, foothold, inventory, first, already? }`. A precondition that fails: 422 `reason: "not_ready"`, no state change |
| `POST /login` (changed, locked) | as today, plus optional `foothold` | 9.3a's checks, with `host_reachable_through?` now true when the host is in `player_reach(foothold)` (so a pivot host on a linked network is reachable only while the pivot session is held and up); plus, when the host's network is down, 403 `unreachable` before the password is read | As today |
| `GET /container/:id` (changed, locked) | as today, plus optional `foothold` | A remote desktop: 9.3a's `desktop_request_allowed?`, now resolving reach through `player_reach` and refusing a down route 403 `unreachable`. A **scoped** request under a remote desktop (a folder, a share): in a scenario with any network `downIf`, re-judge the route and answer 403 `unreachable` (host) or the invented-id 404 (share) when it is down (section 5.2). Otherwise as today | As today |
| `POST /inventory` add (changed, locked) | as today | A `source_pc_id` or `source_resource_id` add on a route that is down is refused with the route's invented-id answer, as the scoped `GET /container` is | As today |
| `POST /unlock` (changed, locked) | as today | An `unlock` scoped under a remote desktop on a down route is refused with the invented-id 422, as 9.3a refuses a share the rule rejects | As today |
| `GET /scenario` (changed) | as today | As today | `filtered_scenario_for_bootstrap` already deletes `networks`, `networkLinks` and `resources`; this slice adds nothing new to ship. The `footholds` block carries Wi-Fi and implant footholds in the same client shape as a jack's |

`reach_conditions` is extended in `NetworkModel`, not a route: 9.2's NPC-work route consumes it
(section 12). No route tells the browser a network's link graph, a resource's network, an SSID or a
key; a down network is shown only as a greyed line with no name of anything new.

## 7. What reaches the browser, and what never does

The 9.3a rule stands: the browser learns a network's name, and the names, hosts and contents of
what the network exposes, only from `GET /network` and `GET /container`, and only for a foothold or
session the server holds. This slice's additions keep inside it.

| Path | Sent | Withheld |
|---|---|---|
| Bootstrap, `GET /scenario` | Footholds (jack, Wi-Fi and implant) in 9.3a's client shape. `wifiAp`, `portSecurity` and `portSecurityMessage` on room objects (so a click and a refusal can be drawn) | `networks`, `networkLinks`, `resources` deleted whole, so no network name, link, SSID, Wi-Fi key, resource name, `host` or share content ships. A network's `downIf` global **name** may already be a scenario global the client holds; the name alone exposes nothing |
| `GET /network` | Per foothold, the own-network rows and the linked-network blocks (`networks`): each network's `name` only once the foothold reaches it, its hosts and resources as 9.3a sends them. A down route: a greyed block, the held-session rows kept, no new name | Every network the foothold does not reach, entirely. Account names, access lists, policies, share contents, the link graph of networks the foothold has not reached |
| `POST /network/join`, `/implant` | The foothold in the bootstrap shape, `first`, the inventory with the link item | Hosts (the view is a separate request). The Wi-Fi key and the implant's preconditions are never echoed |
| `POST /network/plant` port-security refusal | `reason`, `message` (the authored `portSecurityMessage`) | Nothing about the network behind the port: a refused device learns only that the port is protected |
| Events and globals | `network_joined`, `network_device_refused` (reason `port_security`), `network_foothold_gained` (via `wifi` or `implant`); the `<id>_planted`-style display global for a Wi-Fi AP and an implant, as 9.3a publishes `<jackId>_planted` | Nothing server-side is read from them |

**No-exposure test (extended).** The 9.3a no-exposure test gains cases: with no foothold and no
session, no response names a linked network, an SSID, a Wi-Fi key, or a resource on a linked or down
network; a foothold on the first network of a link shows no name from the second until a pivot
session is held; a Wi-Fi key is never in any response (only compared on the server); a down
network's hosts and shares are refused with the same status and body as an invented id; and a
`grant_foothold` action's preconditions never leak the target's network or contents.

## 8. State and saved games

- **No new top-level `player_state` keys.** Wi-Fi and implant footholds are entries in the existing
  `footholds` map, keyed `wifi_<networkId>` and `implant_<pcId>`; `gainedFootholds` holds the access
  point and PC ids. `droppedItems` (read by the implant) already exists. Outages read
  `globalVariables`, which already syncs. So a game from before this slice reads every new reader as
  empty, and a reset drops the footholds and rebuilds the inventory, exactly as in 9.3a.
- **Reload.** Wi-Fi and implant footholds and their link items come back in the scenario response
  and `playerInventory` as a jack's do; `network-links.js` rebuilds a missing link item through
  `restoreHandles` using the sprite and observations the bootstrap foothold carries. Outage globals
  are restored with the rest of `globalVariables`, so a repaired network stays repaired and a
  down-by-default one is down again if its global was not changed. The server's answer always wins
  over a stale display global.
- **A session over a route that went down across a reload** is kept (it is a `sessions` entry); its
  desktop opens again when the route returns, with no password, because the server never deleted it.
- **Games created before this slice** have no `networks`, so every new route answers 404 or an empty
  list, and nothing changes.

## 9. Validator, schema and dungeon graph

### 9.1 Un-reserving the fields

`scripts/validate_network.rb` **removes** the five "needs slice 9.3b" refusals (`networkLinks`;
network `downIf` and `wifi`; object `wifiAp`, `portSecurity`, `portSecurityMessage`; the
`grant_foothold` walk) and replaces each with a real check. `scripts/scenario-schema.json` rewrites
the reserved stubs at `networks` (`downIf`, `wifi`), `networkLinks`, and the object fields into real
definitions, and adds `network/join` and `network/implant` to the routes list where the schema
tracks them. The known-field lists in `validate_scenario.rb` already carry the names (9.3a reserved
them), so only `validate_network.rb` and the schema change.

### 9.2 New validator checks

Errors:

- a `networkLinks` entry that is not a two-item list of ids, or that names a network the scenario
  does not define;
- a `wifi` block with no `ssid`, or a `psk` that is not a string;
- `wifiAp` on an object with no network, or on a network with no `wifi` block, or on a sign-in
  object, a jack or an object with a lock;
- `portSecurity` on an object that is not a `networkJack`, and `portSecurityMessage` without
  `portSecurity`;
- a `grant_foothold` under `flagRewards` or any browser-only action path, one with neither
  `needsDropped` nor `needsSession`, one with both, one whose `pc` is not a sign-in object on a
  network, and (for `needsHeld`) a `needsHeld` that names no item;
- a network `downIf` or resource `downIf` whose value is not a string.

Warnings:

- a `downIf` global that `globalVariables` does not declare (the level 9.2 gives the same mistake);
- an open share with contents on a network that starts down (its `downIf` global's declared default
  is truthy), because a browser can write the global false, so a secret that must not be read early
  must sit behind a session as well;
- a link graph with more than eight simple paths between two networks that both carry hosts or
  resources (the `reach_paths` cap);
- a Wi-Fi key shorter than eight characters, or one that appears nowhere the player can read (using
  slice 9.1's readable-text list where 9.1 is built, so both slices agree on what the player can
  read; a feed post text is added by whichever of this slice and 9.2 lands second);
- a `grant_foothold` whose PC's USB policy would refuse its device (where 9.2's USB policy is
  present);
- a network that is reachable only through a pivot but has no host a foothold can ever sign in to
  (no way to open the pivot session).

Information lines (printed with 9.3a's network-reach lines):

- **Link reach.** For each network, the networks reachable from it through links, and through which
  pivot host each becomes reachable.
- **Outages.** Each network and resource with a `downIf`, and its declared starting state.

### 9.3 Dungeon graph

`scripts/generate_dungeon_graph.rb` gains: a link edge between two network nodes; a pivot edge from
a sign-in host to each network it bridges (so the graph shows the server network reached only
through the finance PC's account); a Wi-Fi access point as a lock-like node the Wi-Fi key opens,
with an edge to its network; and an implant as a node the device (dropped, or held with a session)
opens, with an edge to the PC's network. An outage is drawn as a condition on the network node, not
a separate gate.

### 9.4 Validator and graph tests

`test/js/validator-network-model.test.mjs` and `test/js/dungeon-graph-networks.test.mjs` (both built
by 9.3a) gain one fixture per new error, warning and information line, and graph fixtures for the
link edge, the pivot edge, the Wi-Fi node and the implant node. A clean fixture using every new
field raises no error. Every existing scenario still validates unchanged (none uses a new field;
section 10).

## 10. Effect on existing scenarios

No scenario uses `networkLinks`, a network `downIf`, `wifi`, `wifiAp`, `portSecurity` or a
`grant_foothold` today (checked across `scenarios/`; the `networks` list pages in the
`ca20_remote_and_mobile_working` and social-engineering `wifiList` scenarios are an unrelated
on-screen Wi-Fi list, not this model). So every change below is inert until a scenario opts in.

| Change | Effect on a scenario that does not use the new fields |
|---|---|
| `reach_conditions` gains path globals | A resource on the station's own network is still `[[]]`; with no links there are no other paths. 9.2's NPC plan reads the same empty route |
| `player_reach`/`reach_from` replace the single-network equality | With no links, `reach_from(n)` is `{ n }` when up, so reach is exactly 9.3a's |
| The scoped-request route test | Runs only in a scenario with a network `downIf`; without one, the scoped requests are judged exactly as today |
| `GET /network` gains a `networks` block | Empty of extra networks without links; the own-network `hosts` array is 9.3a's |
| Two new routes and two policy methods | Reached only by the new fields |
| The validator un-reserves five fields | A scenario that used none still validates; `check_network_model` returns early when the scenario has no networks |

`lab_physical_pentest` (which adopted 9.3a networks in step 9) has one network, `office_lan`, and no
links, outages, Wi-Fi or implants, so nothing in this slice touches it until the user asks. Two
later options exist and are **not** taken here (decisions for the user, section 13):

- **Port security** could model the lab's own "disable the unused ports" lesson: a second wall port
  in the comms cupboard with `portSecurity: true` that refuses the drop box and shows the fix. This
  is a small, self-contained addition that strengthens the ROE lesson without changing the chain.
- **The BadUSB beat.** The device pitch's keystroke-injection device could become an implant at an
  unattended PC the player has claimed: it would give a foothold on the office LAN and nothing more,
  and the account would still need its password. 10.2 of the networks design already flags this as a
  separate decision.

Scenarios to rerun because shared code changes under them: `test_access_networks` (the feature
scenario, this slice extends it), and nothing else, because the reach change is inert without links
and the route test is inert without a network `downIf`.

## 11. Tests, with the feature scenario

The approach is 9.3a's: unit tests in every sub-slice; the feature scenario `test_access_networks`
(built by 9.3a) extended with 9.3b beats; scripted regression runs through the `window.__test`
bridge with the two checks after every beat (what reached the browser, what the server recorded);
the no-exposure test after every change to what the server sends; and the first slice's suite runs
wherever sign-in or the desktop changes. All browser runs use a keyless server on the builder's own
port; nothing touches :3000.

**Feature beats added to `test_access_networks`.** The scenario already has `office_lan` and
`workshop_lan`. This slice adds a linked `server_net`, a down-by-default network repaired by an
object, Wi-Fi, a port-security jack, a dropped device an NPC uses, and a BadUSB.

| Beat | Set-up | What should happen | Server record afterwards |
|---|---|---|---|
| N1 No pivot yet | A foothold on `office_lan`; `server_net` linked | The view lists the office network only; no row and no name from `server_net` | One `office_lan` foothold; the leak check finds no `server_net` string |
| N2 Pivot appears | A remote sign-in at a host that bridges `office_lan` and `server_net` | After the sign-in the view gains a "Server network, through <host>" block with its hosts | The session is held; `player_reach` of the foothold now includes `server_net` |
| N3 Sign in across the link | A host on `server_net` | It signs in through the same foothold; its desktop opens; a protected share there maps | A session on the `server_net` host, through the foothold |
| N4 Sign out shrinks reach | Sign out of the pivot host | The server-network block and the onward session go; the view lists the office network only | No `server_net` session; reach back to `office_lan` |
| N5 Down by default | `server_net` with `downIf` truthy at start | Its block shows "no route"; its hosts are not signed in to | A sign-in on it is 403 `unreachable` |
| N6 Repair | An object sets the global false | The block fills in and its hosts sign in | After the repair the hosts are reachable |
| N7 A held session goes down | A session on `server_net`, then the global set true | The desktop closes to a greyed "no route" row; setting it false reopens it with no password | The session is kept throughout |
| N8 Wi-Fi join | An access point on `guest_wifi` | The right key joins; the view lists `guest_wifi`; a wrong key is refused and nothing changes | A `wifi_guest_wifi` foothold; a wrong key counts nothing |
| N9 Second AP | A second access point on the same network | It answers `already` and still completes a task on that AP | `gainedFootholds` has both AP ids |
| N10 Port security | A `portSecurity` jack and the drop box | The device goes in, is refused, stays in the inventory, and the message shows | No foothold; the device still held |
| N11 Dropped device | A device the player drops and an NPC uses | A foothold on the PC's network, no session; the owner's desktop still needs the password | An `implant_<pc>` foothold; no session |
| N12 BadUSB | A PC the player holds a session on, and the BadUSB in the inventory | Plugging it in grants a foothold and consumes the device; no other account opens | An `implant_<pc>` foothold; the device gone from the inventory |

**Unit, Rails and node tests, by sub-slice.** K: `reach_from`, `player_reach` (a chain, a cycle, a
down link), `reach_conditions` with path globals, the view's `networks` block, the pivot not cut by
sitting down. O: `truthy?` with every falsy value, a down network withheld everywhere, the held
session kept and shown "no route", the scoped-request route test refusing a down route. W: the join
route, the second-AP `already`, a wrong key, an open network, the link-item sprite. P: the plant
refusal, the device kept. I: each precondition of `implant_foothold!`, the USB hook, the foothold
reaching the PC's network only, the device consumed for the session shape. The 9.3a no-exposure test
gains section 7's cases. Scripted runs: one per sub-slice over its N-beats with the two checks after
each, then the first slice's suite runs after K and O (sign-in and the desktop change).

## 12. Build steps and shared files

Build the sub-slices in the order of section 3 (K, O, W, P, I). Within each, build the server first,
then the validator and schema, then the client, then the feature beats and runs, as 9.3a's steps do.
A sub-slice is done when its unit tests, the node suite, the Rails suite, the no-password and
no-exposure tests and every earlier run pass, and, for a sub-slice that changes client code, the
phone reopen check (`node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`),
as every engine change requires.

| Stream | Sub-slices | Owns (this slice's own files) | Order |
|---|---|---|---|
| S, server | K, O, W, P, I | `lib/break_escape/network_model.rb`, `app/models/break_escape/network_access.rb`, hooks in `game.rb`, `games_controller.rb`, `config/routes.rb`, `app/policies/break_escape/game_policy.rb`, `test/**/network_*` | First in each sub-slice |
| T, tooling | K, O, W, P, I | `scripts/validate_network.rb`, hooks in `scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `scripts/generate_dungeon_graph.rb`, `README_scenario_design.md` (the networks section), `tools/playtest/lib/access_leak_scanner.rb` and `verify-run.rb` (Wi-Fi-key and new-foothold lines) | When the sub-slice's `network_model.rb` change is committed |
| C, client | K, O, W, P, I | `systems/network-links.js` (the Wi-Fi/implant branches and the five-second refetch), `minigames/network-view/network-view-minigame.js` (the `networks` block and the greyed rows), `minigames/password/password-minigame.js` (Wi-Fi key mode, already present for keys), their tests | When the sub-slice's server route is committed |
| F, feature scenario | each sub-slice | `scenarios/test_access_networks/**` | After S and T of the sub-slice |

**Files shared with other work, and the order on each.** One plan at a time holds each; a builder
re-reads the file just before editing, edits only its own block, never reformats, and commits with
explicit paths. Slice 9.2's sub-slices L and C are being built now on other branches, so these are
live:

| File | Also edited by | Sequence and note |
|---|---|---|
| `lib/break_escape/network_model.rb` (`reach_conditions`) | 9.2 L/C consume its output (`routes` in the NPC plan) | This slice **changes the output** of `reach_conditions` (adds the path `downIf` globals). 9.2's `npc-work.js` evaluates those globals. Land the `NetworkModel` change and tell 9.2 its route lists now carry network-path globals as well as the resource's own; whichever lands second re-reads and the two agree on the order (station, intermediates, resource network) |
| `app/models/break_escape/game.rb` | 9.2 (needs, work, policy), the engine plan (E4) | Different methods. This slice's hooks are in `NetworkAccess` (a concern) plus `effective_policy`'s neighbour `usb_refused?`; 9.2's sub-slice U owns the USB policy read, so whichever lands second adds `usb_refused?` and the implant's call to it. Re-read before editing |
| `app/models/break_escape/npc-needs.js` work path (`npc-needs.js`, `npc-work.js`) | 9.2 L/C | **Not edited by this slice.** The NPC work path reads `reach_conditions`' output; this slice changes only what that function returns, not these files. If a run shows the new path globals break 9.2's evaluator, raise it with 9.2 rather than editing its files |
| `scripts/validate_access_work.rb` | 9.2 | **Not edited by this slice.** 9.2 owns the resource `downIf` validator message; this slice adds the network `downIf` and link checks in `validate_network.rb` only. The undeclared-global warning text should match 9.2's wording; copy it, do not move it |
| `public/break_escape/js/api-client.js` | 9.2, 9.1 | This slice adds `networkJoin` and `networkImplant`. Different methods; re-read and append |
| `public/break_escape/js/core/game.js` | 9.1, 9.2 | 9.3a already hands `footholds`/`gainedFootholds` to `network-links.js` here; Wi-Fi and implant footholds flow through the same path, so this slice likely needs **no** change here. If the five-second refetch needs a lifecycle hook, add it in its own block and re-read |
| `scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `README_scenario_design.md` | 9.1, 9.2, the engine plan | Each appends its own block or section; the names are already in the known-field lists (9.3a reserved them), so only the schema stubs and the README section change here |

Review and playtests follow `AGENTS.md`: adversarial review rounds of this plan before any build,
an implementation review after each stream, and the scripted runs listed per sub-slice.

## 13. Open questions for the user

Each carries a recommended answer; the plan is written as if the recommendation is taken, and the
user can overrule.

1. **Build 9.3b now, or hold it behind the parked work?** The 2026-11-10 order was 9.3a, 9.1, 9.2,
   then 9.3b. 9.3b's reach change shares `reach_conditions` with 9.2's live L/C branches.
   *Recommended:* plan now (this document), build K and O after 9.2's L/C land so the shared
   `reach_conditions` has one owner at a time; W, P and I can build in parallel with later 9.2 work
   because they touch different code.
2. **Does `lab_physical_pentest` adopt any of 9.3b?** *Recommended:* add port security to an unused
   comms-cupboard port (small, strengthens the "disable unused ports" lesson, no chain change), and
   hold the BadUSB implant beat for a later pass. Decide separately from this slice.
3. **The foothold id and `via` names for Wi-Fi and implants** (`wifi_<networkId>`,
   `implant_<pcId>`, `via: "wifi"` / `"implant"`). *Recommended:* keep as written; they match the
   `jack_<id>` pattern and read naturally. Flagged because they become saved-game keys.
4. **Does an outage ever delete a session, or always keep it?** *Recommended:* always keep it and
   show "no route"; a held session over a flapping link should not be lost, and the player's own
   action (sign out, unplug) is the only thing that ends a session. This is what section 5.2 does.
5. **Port security as refuse-only, or add a bypass later?** *Recommended:* refuse-only in this
   slice (it teaches the control); a bypass (an allow-list the device is added to) is a separate,
   larger piece and is left out here.
6. **The eight-path cap on `reach_paths`.** *Recommended:* keep eight with a validator warning
   above it; real segmented networks rarely need more, and an uncapped walk on a dense link graph is
   a performance risk on every `GET /network`.
