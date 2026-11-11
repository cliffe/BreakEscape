# Access model slice 9.3b: links, outages, Wi-Fi, port security, implants

Status: **design, 2026-11-11. Nothing here is built.** This is the build-ready plan for the second
half of networks. It stands on slice 9.3a (networks, built and merged: a rogue device in a network
jack, the link item, the network view, remote sign-in with captured credentials, headless hosts,
file shares, and the secrecy, validator, dungeon graph and tooling that go with them). It takes the
place of section 12 of `ACCESS_MODEL_SLICE_9_3_PLAN.md` (called "the 9.3a plan" below), which
sketched this slice; where this plan and that sketch differ, this plan wins. Claims about existing
code were checked against the code in this worktree; method and constant names are the stable
reference, line numbers move.

A fresh builder can follow this plan without reading any review. Every version of it is complete
and self-contained.

How to read it: section 1 says why and what ships; section 2 is what the code does today, verified;
section 3 the five sub-slices and their order; section 4 the scenario fields; section 5 the engine
behaviour of each part; section 6 the server routes with their checks; section 7 what the browser
receives and what a tampered browser still gets; section 8 state and saved games; section 9 the
validator, schema and dungeon graph; section 10 the effect on existing scenarios and on
`lab_physical_pentest`; section 11 the tests and the feature scenario; section 12 the build steps,
the ownership and order table and the files shared with 9.2 L and C; section 13 the interfaces;
section 14 the open questions for the user; section 15 what is left out.

The game is a puzzle-solving simulation in which behaviours chain together. Everything below is
judged by one test, the user's: can a student **cause** something, **see** what it did,
**understand** what that gave them, and **use** it for the next step? And two rules the whole
access model keeps: a step that must not be skippable ends in something the server checks, and a
captured value held by the browser can pace a puzzle but is never the only thing between the player
and a secret.

## 1. What this slice adds, and why now

9.3a made "plant one device on one network, see what it exposes, sign in to a host with a captured
password" a chainable mechanic. Each foothold reaches its own network and nothing else. This slice
adds the rest of the network model, so a scenario can teach the controls that decide reach beyond a
single flat network:

- **Links and the pivot** (5.1): networks are joined by links, but a rogue device is not a member,
  so a second network is reached only through a host the player has signed in to. This is network
  segmentation, taught as a chain: the pivot rests on a password the server checked.
- **Outages** (5.2): a network or a resource can be down while a global holds. A down network drops
  out of reach, and the player sees why. An outage paces a puzzle and is a distraction tool, never
  protection.
- **Wi-Fi** (5.3): a foothold gained by joining a wireless network with its key, in place of a
  wired jack. The key is a lock secret, compared on the server, never held by the browser.
- **Port security** (5.4): a jack that refuses an unknown device, with no foothold and no bypass. A
  control the player watches work.
- **Implants** (5.5): a foothold given by a device plugged into a PC rather than a jack, in two
  shapes the lab already wants: a member of staff plugs in a device the player dropped, and the
  player plugs a keystroke-injection device into a PC they are signed in to. An implant gives a
  foothold and nothing else; the account still needs its password.

9.3a reserved every field this slice reads, and its validator refuses each with "needs slice 9.3b"
(section 2), so no scenario changes shape when this slice lands. The device pitch
(`planning_notes/physical_pentest_devices/DEVICE_PITCH.md`) routed its covert network and implant
devices here: the Wi-Fi Pineapple's foothold-over-Wi-Fi is 5.3, the player's BadUSB is 5.5, and the
switch drop box is already 9.3a's.

## 2. What the code does today (verified)

Facts this plan builds on. Each names the method or constant it means, so a builder re-finds a line
that moved.

| Area | Today | Where |
|---|---|---|
| Reserved fields, refused | 9.3a's validator errors on top-level `networkLinks`, on `downIf` and `wifi` on a network, on `wifiAp`, `portSecurity` and `portSecurityMessage` on an object, and on any `grant_foothold` action, each with "needs slice 9.3b" | `scripts/validate_network.rb` (`NETWORK_RESERVED_OBJECT_FIELDS`, `NETWORK_RESERVED_NETWORK_FIELDS`, the `grant_foothold` walk) |
| Schema reservations | `networks.<id>.downIf` (string), `networks.<id>.wifi` ({ ssid, psk }), top-level `networkLinks` (list of pairs), object `wifiAp`, `portSecurity`, `portSecurityMessage` are present with "reserved for slice 9.3b" descriptions. `additionalProperties` on `resources` is open (9.2 owns other fields) | `scripts/scenario-schema.json` |
| Reach | `NetworkModel.reach_conditions(data, station_network, resource)` returns `[[]]` (one route, no conditions) when the resource has no network or is on the station's, else `[]` (no route). It takes `data` first but does not read it in 9.3a. The comment says "9.3b extends the answer with links and outages, read from data" | `lib/break_escape/network_model.rb` |
| A foothold | `footholds[footholdId] = { via, network, source, device, seq }`, `footholdId` is `jack_<jackId>`, `device` is the server's copy, `via` is `jack`. `gainedFootholds` is every source ever gained from. Both in `ACCESS_STATE_DEFAULTS`, dropped on reset | `app/models/break_escape/network_access.rb`, `game.rb` `ACCESS_STATE_DEFAULTS` |
| A session over the network | `sessions[pcId] = { id, via: "password", foothold }`. `host_reachable_through?(foothold_id, pc)` is true when the foothold is held, the PC is a sign-in object with a network, and that network is the foothold's. `desktop_request_allowed?(info, foothold_id)`: with a foothold, host reachable and policy allows remote and the session is not a claim; without, physically reachable and not headless | `network_access.rb`, `game.rb` `attempt_login!` |
| The network view | `GET /network` composes, per held foothold, `{ id, via, name, network: { id, name }, hosts: [...] }`, hosts (sign-in objects on the foothold's network) then resources, each by id. A host row carries `remoteSignIn`, `session` and `headless`; a resource row `open`, `listed` and `observations`. It refetches on every open; `network-links.js` owns the trip and the landing table | `network_access.rb` `network_view`, `network_rows`; `minigames/network-view/network-view-minigame.js`; `systems/network-links.js` |
| Mapped shares | `mapped_shares(pc, npc)` returns every `file_share` on the PC's network the session's identity may use, as a desktop folder stub (`mapped_share_stubs`). `resource_admits_player?` and `resource_acl_admits?` decide a share; a share with no network, or a listed-only share (no contents), maps nowhere | `network_access.rb` |
| Remote sign-in client | `openLoginSignIn` reads `scenarioData.remote`, skips `GET /login_accounts`, shows no tiles, carries the foothold; `password-minigame.js` sign-in mode shows **Captured sign-ins** from `readCaptures` and `/capture_secrets`'s `accounts` and `secrets`. A session keeps `remote`, `footholdId`, `host`; an unplug ends the sessions named in `endedPcIds` | `systems/unlock-system.js`, `minigames/password/password-minigame.js`, `systems/pc-sessions.js` |
| State sync | `window.stateSync` (`systems/state-sync.js`) merges globals every 30 s and on page hide; `sync()` runs one pass, `syncConfirmed({ attempts, onRetry })` awaits a confirmed save and returns true, used before an emit that must follow a save (`triage-starter.js`) | `systems/state-sync.js` |
| The password minigame | `validatePasswordWithServer` posts `POST /unlock(targetType, targetId, attempt, 'password')`; a wrong one is 422 and a real attempt; sign-in mode posts `POST /login` through `pc-sessions.js`. The scene takes `params.lockable`/`sprite` and a key mode exists for door keys | `minigames/password/password-minigame.js` |
| Declared grants | `DeclaredGrants.for(scenario_data)` is the server's allowlist of client `give_item` rewards, from the paths the engine runs `give_item` on: `timers[i].actions[j]`, `<object>.triggerOnInteract[j]`, `onInteract.actions[j]`, `completionActions[j]`, `conditionalActions[k].actions[j]`, and a `confirm_action.onConfirm[j]` on one of those. `flagRewards`, `eventMappings` and `startItemsInInventory` are not grants. `executed?(keys)` is the path test | `lib/break_escape/declared_grants.rb` |
| Dropped items | `add_item_to_room!` with `source_type: "player_drop"` requires the item be held and `droppable`, then appends its id to `player_state['droppedItems']` (grow-only). The comment says the dropped proof and "slice 9.3b's implant check" read this list | `game.rb` `add_item_to_room!` |
| USB policy (slice 9.2) | `AccessWork.usb_policy_for(data, obj)` and `plant_refused?(data, obj, item)` read a `policy.usb` of `allowed`/`storage_blocked`/`blocked` against an item's `usbClass` (`storage`/`hid`); `effective_policy(pc)` (`game.rb`) resolves a PC's policy. The player plant asks `pcPolicy.plantRefusal` in `interactions.js`. 9.2's plan says 9.3b adds a Ruby `usb_refused?(pc, item)` beside `effective_policy` reading the same table | `lib/break_escape/access_work.rb`, `systems/pc-policy.js`, `game.rb` |
| apply-actions | The client action runner has a `case` per action type (`set_global`, `give_item`, `remove_item`, `unlock_object`, `confirm_action`, ...). 9.3b adds an implant case here. The engine plan (E4) and this slice are the named editors | `systems/apply-actions.js` |
| Lab BadUSB beat | The player drops `kit_deviceB` (`droppable`, `needsTag: tag_deviceB`) on `open_plan`; Sofia (`lord`, `needsHome: usb_target_pc`) picks it up and uses it at `usb_target_pc` (`affordance.accepts` includes `tag_deviceB`); a mapping on `npc_used:usb_target_pc` sets `kp_usb_foothold`; a `give_item` timer `grant_remote_session` hands a hand-written `type:"pc"` Remote Session (`records_remote_session`) with text files. The malicious cable (`kit_cable`, `dev_cable`) and plain stick (`kit_usb`, `dev_usb`) are parallel beats with their own grants | `scenarios/lab_physical_pentest/scenario.json.erb` |
| Lab networks (9.3a, built) | The lab has `networks.office_lan`, `resources.lw_fs01_records` (listed-only share), `resources.lw_prn02`, the jack `network_port`, the headless host `store_controller`, and the staff PCs on the LAN. The BadUSB beat above is **not** yet network-aware: its foothold is still a hand-written grant | same file |

## 3. Sub-slices

Five sub-slices, in this order. Each ends playable and tested and has its steps in section 12. None
is gated on a 9.2 sub-slice; all land after 9.2 in file order (section 12).

| Sub-slice | Contents | Feature scenario beats |
|---|---|---|
| **P. Port security** (first) | `portSecurity` on a jack, an optional message, a refused plant that keeps the device. No new state, no reach change | N1 |
| **O. Outages** | `downIf` on a network and on a resource, read into reach; a down network and its hosts drop from the view with "no route"; held sessions kept and refused with 403 `unreachable`; the five-second refetch and the forced sync | N2, N3 |
| **K. Links and the pivot** | `networkLinks`; reach that grows through a session on a host that reaches a linked network; the view's "through" blocks; `reach_conditions` with links and outages for 9.2's NPC work | N4 to N6 |
| **W. Wi-Fi** | `networks.<id>.wifi`, `wifiAp` on an object, `POST /network/join`, a `wifi_<networkId>` foothold, the key compared on the server | N7, N8 |
| **I. Implants** | the `grant_foothold` action in two shapes, `POST /network/implant`, the server's record checks, the USB-policy check at the use | N9, N10 |

**Order, and why.** P is first: it changes one route (plant) and nothing else, and proves the
reserved-field machinery flips cleanly to accepted. O is next because K's reach and the view both
depend on outages (a linked network can be down), and O's "judge a desktop request on its foothold,
not on doors" rule (5.2) is what K's onward desktops need. K builds the pivot on O's reach. W is a
second foothold kind that reuses O and K's reach unchanged. I is last: it is the most server-state
work and it reads 9.2's USB table and the engine plan's `droppedItems`, both of which are built by
then. Each sub-slice is worth playing on its own.

## 4. Scenario fields

One example of each new field; the subsections and section 5 say what they mean. Everything here is
refused by 9.3a's validator today and accepted by this slice.

```jsonc
{
  "networks": {
    "office_lan":  { "name": "Harbour office LAN" },
    "server_net":  { "name": "Server network", "downIf": "power_cut" },
    "guest_wifi":  { "name": "Guest Wi-Fi", "wifi": { "ssid": "Harbour-Guest" } },
    "staff_wifi":  { "name": "Staff Wi-Fi", "wifi": { "ssid": "Harbour-Staff", "psk": "seahorse-lantern-77" } }
  },

  "networkLinks": [ ["office_lan", "server_net"] ],

  "resources": {
    "ledger_archive": { "kind": "file_share", "name": "Ledger-Archive", "host": "HB-FS01",
                        "network": "server_net", "access": { "roles": ["finance"] },
                        "downIf": "share_maintenance", "contents": [ /* ... */ ] }
  },

  "rooms": {
    "roof": {
      "objects": [
        { "id": "staff_ap", "type": "pc", "sprite": "wifi_ap1", "name": "Staff access point",
          "wifiAp": true, "network": "staff_wifi" }
      ]
    },
    "comms_room": {
      "network": "office_lan",
      "objects": [
        { "id": "secured_port", "type": "pc", "sprite": "network_rack1", "name": "Managed wall port",
          "networkJack": true, "network": "office_lan", "portSecurity": true,
          "portSecurityMessage": "The switch drops the link: this port only accepts known devices." }
      ]
    },
    "open_plan": {
      "network": "office_lan",
      "objects": [
        { "id": "sofia_pc", "type": "pc", "name": "Sofia's PC", "host": "HB-FIN-07",
          "locked": true, "lockType": "login", "network": "office_lan" }
      ]
    }
  },

  "timers": [
    { "id": "sofia_implant", "startOnGlobal": "kp_usb_used",
      "actions": [
        { "type": "grant_foothold", "pc": "sofia_pc", "needsDropped": "kit_badusb",
          "name": "BadUSB on Sofia's PC" }
      ] }
  ]
}
```

### 4.1 Networks and links

- `networkLinks` is a list of two-item lists of network ids. A link is undirected: members of
  either network reach the other. It joins networks, never a foothold to a network (5.1).
- `networks.<id>.downIf` names a global. While the global is truthy (5.2) the network is down.
- `networks.<id>.wifi` is `{ ssid, psk }`. `psk` is the key; absent means an open network. The key
  lives here and nowhere else, in a block that never ships (section 7).

### 4.2 Resources

- `downIf` on a resource is 9.2's field (an NPC's work fails while it holds); this slice reads it
  for the player too, so a share behind a down resource is not served. 9.2 owns the field's schema
  entry; this slice reads it and adds no duplicate.

### 4.3 Objects

| Field | On | Meaning |
|---|---|---|
| `wifiAp` | any room object | An access point: clicking it joins its network (5.3). Several may serve one network. The object carries `network` (its own or its room's) |
| `portSecurity` | a jack | The jack refuses an unknown device: the device goes in, the switch rejects it, no foothold, the device stays held (5.4) |
| `portSecurityMessage` | a jack | The refusal line; default "This port only accepts known devices." |

### 4.4 The implant action

`grant_foothold` is a scenario action, allowed only on a path the engine runs actions from and the
server's declared-grant walk covers (`DeclaredGrants.executed?`: `timers`, `triggerOnInteract`,
`onInteract.actions`, `completionActions`, `conditionalActions`, and a `confirm_action.onConfirm` on
one of those). Two shapes:

```jsonc
{ "type": "grant_foothold", "pc": "<pcId>", "needsDropped": "<itemId>", "name": "..." }
{ "type": "grant_foothold", "pc": "<pcId>", "needsSession": true, "needsHeld": "<itemId>", "name": "..." }
```

- `needsDropped` (a member of staff plugs in a device the player dropped): the server requires
  `droppedItems` to hold `<itemId>`.
- `needsSession` with `needsHeld` (the player's BadUSB at a PC they are signed in to): the server
  requires a session the player holds at `pc` (a claim or a password sign-in, not through a
  foothold) and that the inventory holds `<itemId>`; the implant then takes that item out of the
  inventory as a plant does.
- Exactly one of `needsDropped` / `needsSession` is required; both, or neither, is a validator error
  (section 9). `grant_foothold` under `flagRewards` or `eventMappings` is a validator error (those
  paths are off the server's declared-grant list).

## 5. Engine behaviour

### 5.1 Links, and the pivot through a session

**A rogue device is not a member.** A foothold from a jack (or a Wi-Fi join) still reaches only its
own network. This is the segmentation lesson in one rule: the servers accept only managed machines.

**A session is a place to stand.** When the player holds a session at a sign-in host that a held
foothold reaches (any session there, however opened, so sitting down at a pivot host, which clears
the session's `foothold` in 9.3a, does not cut the pivot), that foothold's reach grows by every
network the host reaches over links that are up. The onward hosts can be signed in to in turn, which
can extend reach again. Signing out, or unplugging, shrinks it back.

So a network chains to a network only through something the server checked: the password of the
session the player pivots through. Nothing between two networks rests on a client-written value.

**The reach model** (`NetworkModel`, shared by the server, validator and dungeon graph):

- `reach_from(data, network)`: the set of networks reachable from `network`, that network and every
  network linked to it transitively, crossing only links whose both ends are up. A network is up
  when its `downIf` is absent or not truthy by `truthy?` (5.2). Wi-Fi networks are ordinary
  networks here: a link may join one.
- `player_reach(data, foothold, session_networks)`: the networks a foothold reaches now. Start from
  the foothold's own network; for each host at which the player holds a session (the caller passes
  their networks, computed from `sessions`), if a network already in reach reaches that host's
  network, add `reach_from(host_network)`. Repeat to a fixed point. The foothold's own network is
  added even when it is itself down (its hosts then show "no route", 5.2), so a held session's row
  is never silently lost.
- `reach_conditions(data, station_network, resource)` (the function 9.2's NPC work already calls):
  returns the routes from `station_network` to the resource's network, each route a list of the
  `downIf` globals on it (the networks crossed, and the resource's own `downIf` left to 9.2 as 4.2
  says). `[[]]` is one route with no conditions, `[]` no route. Routes are simple paths, shortest
  first, at most eight; the validator warns when the link graph needs more (section 9). This is the
  only `NetworkModel` function 9.2 reads, and its signature does not change; 9.3a returned `[[]]`/`[]`,
  this slice fills in the real routes.

**What the view shows.** `GET /network` gains, per foothold, a `networks` list: the foothold's own
network first (its hosts, as today), then each pivoted-to network as a further block,
`{ id, name, via: { hostId, host, displayName } | null, hosts, down }`. `via` names the session the
block is reached through ("Servers, through HB-FIN-07, signed in as Sofia Lord"); it is `null` for
the foothold's own network. The client renders each block under a heading. A down network is one
greyed line (5.2). Mapped shares on a desktop use `reach_from` of the PC's network, so a finance PC
maps a share on the server network for the player exactly as it does for the member of staff.

### 5.2 Outages

**Truthy is JavaScript's.** The browser decides the same question for 9.2's NPC work, so
`NetworkModel.truthy?(value)` matches JavaScript and 9.2's `truthy`: false for `false`, `nil`, `0`,
`""` and a missing key, true for everything else, the string `"false"` included. The server reads a
`downIf` global from `player_state.globalVariables`, falling back to the scenario's declared default
in `globalVariables`. `truthy?` is tested against each of those values and is used everywhere the
server reads a `downIf`.

**What a network outage does.**

- **Reach.** A down network is not crossed by `reach_from`, so a pivot through a down network, and a
  network reached only across a down one, drop out of reach. The foothold's own network stays in
  reach even when down (its hosts show "no route").
- **The view.** A network reached through a pivot that is down, or the foothold's own down network,
  shows as one greyed line, "<name>: no route". Under it, each host where the player holds a session
  through this foothold keeps a greyed row whose click says "No route to <host>", so a held session
  is never silently missing. A down network's hosts the player has no session at are not listed.
- **Desktops and shares.** The server keeps a session on a down network and answers its desktop
  request 403 `unreachable`; when the route returns the desktop opens with no password. A mapped
  share on a down network is not mapped while it is down.

**A desktop request is judged on its foothold, not on doors** (9.3a's rule, extended). In 9.3b the
scoped requests under a remote desktop, the ones that read a session (scoped folders, the inventory
add from a desktop, an unlock inside a desktop), also carry the foothold and are judged on the route
being up, not only on "a session exists". 9.3a left those as "a session exists" because rooms do not
relock and an unplug deletes the sessions it carried; an outage is the new case where a held session
is temporarily out of reach, so the route is re-tested (section 6).

**A resource outage** (`downIf` on a resource) means the same for the player: the share is not
served while it holds, by the same `truthy?`. 9.2 owns what a resource outage does to an NPC; this
slice reads it for `GET /container` and `GET /network`.

**Keeping the server's view current.** A `downIf` global can be written by the browser (a breaker,
a plant), by the server when it completes a task whose `onComplete.setGlobal` names it, or, once
9.2's sub-slice B is built, by a workaround. The client `await`s `window.stateSync.syncConfirmed()`
before `GET /network`, a remote sign-in, and any desktop or share fetch while a foothold is held or
the last desktop showed a mapped share, so the server reads the outage the player just caused. An
open view refetches every five seconds; it does not refetch on every global change, because the
needs and workstation layers publish globals constantly. 9.3a refetched only on open or return; this
slice adds the timer while open.

**Strength.** A `downIf` global written by the browser is pacing and a distraction tool, never
protection: anything that must not be read early sits behind a session as well. The validator warns
about an open share with contents behind a network that starts down (section 9).

### 5.3 Wi-Fi

- `networks.<id>.wifi = { ssid, psk }`. An access point is any room object with `wifiAp: true` on
  such a network (its own `network`, or its room's). Several access points may serve one network.
- Clicking an access point asks for the key in the password minigame's key mode; the server
  compares it (`POST /network/join`). The foothold id is `wifi_<networkId>`. A Wi-Fi foothold, like
  a jack's, reaches its own network only, and extends through sessions exactly as a jack's does
  (5.1).
- `psk` absent is an open network: the click joins with no key prompt.
- Joining through a second access point of a network already joined answers `already: true` **and
  still** adds that access point id to `gainedFootholds` and emits `network_joined` for it, so a
  task or mapping on either access point completes.
- No device and no range: the server cannot check range, and a join needs no rogue device. The link
  item's picture is the access point object's own sprite (never the phone's), so the tray does not
  hold two phone icons that open different things.
- A Wi-Fi key is a lock secret like a door PIN, not an account password: ink may say it. The key is
  compared on the server and the browser never holds it. Wrong keys are not counted (no lockout,
  section 15), so the validator warns about a key shorter than eight characters, and about a key
  that appears nowhere the player can read (section 9).

### 5.4 Port security

`portSecurity: true` on a jack: a plant there puts the device in, the switch refuses an unknown
device, no foothold is given and the device stays in the inventory. The client shows the jack's
`portSecurityMessage` (or the default) and emits `network_device_refused` with reason
`port_security`. It only refuses; a bypass is not part of this slice. The check is on the server
(`POST /network/plant`, section 6), so a tampered browser gains no foothold at a secured port.

### 5.5 Implants

An implant is a foothold given by a device plugged into a PC rather than a jack, through the
`grant_foothold` action (4.4). **It gives a foothold and nothing else:** no session, no desktop, no
owner's access. The foothold is on the PC's own network and, like every foothold, reaches only that
network. The owner's desktop still needs the owner's password through the ordinary remote sign-in.
So the rogue USB beat becomes "the stick gives you the network; the keylogger or the phish gives you
the account", which is a chain and not a gift; and the player's own BadUSB turns one desk into a way
onto the network and opens no other account.

**The server checks what it can** (`POST /network/implant`, section 6). The action is declared for
that PC, found by the declared-grant walk. Then:

- `needsDropped`: `player_state['droppedItems']` holds the item (the server's own record of a player
  drop, written in `add_item_to_room!`; grow-only, so it survives the item being picked up again).
- `needsSession` with `needsHeld`: `sessions[pc]` holds a session the player has (a claim or a
  password sign-in, **not** one through a foothold, so the player cannot implant a PC they only
  reached remotely), and the inventory holds `needsHeld`. The implant takes `needsHeld` out of the
  inventory as a plant does (it is the physical device, now left in the PC).
- Where 9.2's sub-slice U is built, the PC's policy must not refuse the device's `usbClass`. The
  check is a Ruby `usb_refused?(pc, item)` beside `effective_policy`, reading 9.2's table
  (`AccessWork.plant_refused?`). A device under a blocking USB policy fails **at the use**, not at
  the drop: it is dropped, picked up and carried first, and refused when it is plugged in.

The implant's foothold id is `implant_<pcId>`, `via` is `implant`. A repeat answers `already: true`.

**Strength.** The rogue USB trigger (the NPC's use of a dropped device) is still reported by the
browser, so that implant is weaker than a plant and is graded so. What it yields is bounded: a list
of hosts, every one of which still asks for a password the server checks. That is why it may be
client-triggered. The player's BadUSB trigger rests on the server's session and inventory records,
so it is as strong as a plant. A scenario that wants "the stick lands you inside her session" builds
it from pieces the server checks: an implant for the network and a captured password for the
account. The pitch's own pattern (a timer that grants a hand-written remote session) is not used for
a device that reaches a network: its payload is the foothold, and what the foothold shows is the
network view.

## 6. Server routes

Every route this slice adds or changes, with its checks in the order they run. A failed check stops
the request. "Locked" means the route joins the `with_game_lock` list. Status codes follow 9.3a's
(404 unknown target, 403 unreachable, 422 a refusal the player caused), except where a refusal must
look like an unknown id, when it is whatever that route answers for an invented id.

The two new routes sit in the routes' member block with named actions, each with a policy method
answering as `show?` does (`network_join?`, `network_implant?`), or `authorize @game` raises:

```ruby
post 'network/join',    to: 'games#network_join',    as: 'network_join'
post 'network/implant', to: 'games#network_implant', as: 'network_implant'
```

| Route | Parameters | Checks, in order | Writes and answer |
|---|---|---|---|
| `POST /network/plant` (changed, locked) | as 9.3a | After the existing checks (jack exists, reachable, already-planted, device held), one added **before** writing the foothold: the jack's `portSecurity` is not true. If it is: 422 `reason: "port_security"`, the `portSecurityMessage` (or default) as `error`, no foothold, the device left in the inventory | As 9.3a on success; on port security, nothing written |
| `POST /network/join` (new, locked) | `ap_id`, optional `key` | 1. The access point exists: a room object with `wifiAp: true` and a network the scenario defines; else 404 `{ success: false, error: "Access point not found" }`. 2. Object reachable (`object_reachable?`); else 403 `reason: "unreachable"`. 3. A foothold `wifi_<networkId>` exists already: answer it again with `already: true`, add `ap_id` to `gainedFootholds` if absent, emit nothing new server-side (the client emits `network_joined`). 4. The network has a `wifi.psk`: the `key` matches it (exact, server-side); else 422 `reason: "wrong_key"`, no failure counted. A network with no `psk` skips check 4 | Success: `footholds[wifi_<networkId>] = { via: "wifi", network, source: ap_id, seq }` (no `device`); `ap_id` joins `gainedFootholds`; a link item joins the inventory (its sprite the AP's own). Answer `{ success, foothold, inventory, first, already? }` |
| `POST /network/implant` (new, locked) | `action_index` or enough to name the declared action; `pc` | 1. The scenario declares a `grant_foothold` for this `pc` on a path the declared-grant walk covers; else 404. 2. For `needsDropped`: `droppedItems` holds the item; else 422 `reason: "not_dropped"`. For `needsSession`: `sessions[pc]` is a session the player holds that is not through a foothold, **and** the inventory holds `needsHeld`; else 422 `reason: "no_session"` or `reason: "not_held"`. 3. Where 9.2 U is built: `usb_refused?(pc, item)` is false; else 422 `reason: "usb_refused"`, the refusal line. 4. A foothold `implant_<pc>` exists already: `already: true`, write nothing | Success: for `needsSession`, `needsHeld` leaves the inventory (as a plant, 9.3a 4.1); `footholds[implant_<pc>] = { via: "implant", network: <pc's network>, source: pc, seq }`; the link item joins the inventory. Answer `{ success, foothold, inventory, first, already? }` |
| `GET /network` (changed) | optional `foothold` | As 9.3a | Per foothold, the answer gains `networks: [{ id, name, via, hosts, down }]` (5.1): the foothold's own network first, then each pivoted network, each either its hosts or `down: true` with only the held-session rows (5.2). `hosts` at the top level (9.3a's shape) stays, equal to the first block's hosts, so a 9.3a-era client is unaffected |
| `GET /container/:id` (changed, locked) | as 9.3a, plus the scoped sub-requests now carry `foothold` | **A sign-in object, with `foothold`:** the 9.3a checks, plus the route from the foothold to the host is up (`player_reach` includes the host's network); else 403 `reason: "unreachable"`. **A resource:** `resource_admits_player?`, and the resource's network is up and its own `downIf` is not truthy; else the invented-id 404 | As 9.3a, with mapped shares limited to networks that are up |
| `POST /unlock`, `POST /inventory` add (changed, locked) | as 9.3a, plus `foothold` on a scoped request under a remote desktop | The scope checks of 9.3a, plus: when the scope is reached through a foothold, the route is up; else the route's own unknown-id refusal (4.5 of the 9.3a plan) | As 9.3a |

`POST /logout`, `POST /network/unplug` are unchanged. `POST /network/unplug` of a Wi-Fi foothold is
"leave the network": it already removes the foothold and ends the sessions it carried; the client's
leave control is the link item's own, so no route change is needed (section 8).

## 7. What the browser receives, and what it never does

The rule, from 9.3a, holds: the browser learns a network's name, and the names, hosts and contents
of what it exposes, only from `GET /network` and `GET /container`, and only for a foothold or
session the server holds. This slice keeps it and adds the new secrets.

**What is not secret, and ships.** Network ids and resource ids (they appear in event mappings and
tasks). A link is a pair of ids, so `networkLinks` itself names nothing a player can use; but it
tells a reader which networks are joined, so it is withheld with the rest (below) to keep the
bootstrap from naming networks at all.

**What this slice must newly withhold:** a Wi-Fi `psk`, above all. The key never reaches the
browser: the join compares it on the server. The `wifi` block ships nowhere.

| Path | Sent | Withheld |
|---|---|---|
| Bootstrap, `GET /scenario` | As 9.3a (footholds held, with their link items). A Wi-Fi foothold's bootstrap entry carries `via: "wifi"` and its link item | `networks` (so no `wifi` block, no `ssid`, no `psk`, no `downIf`), `networkLinks` and `resources` are deleted (9.3a already deletes the three top-level keys; `wifi`, `downIf` and the link live inside `networks`/`resources`, so they go with them). `wifiAp`, `portSecurity` and `portSecurityMessage` on an object **ship in room data** (they are controls the player interacts with; `portSecurityMessage` is a message meant to be read, and `wifiAp`/`portSecurity` name nothing secret) |
| Room data | A jack's `portSecurity` and `portSecurityMessage`; an object's `wifiAp` and, for an access point, the `ssid` it advertises (an SSID is broadcast in the world and is not secret) | `network` on every object and room (9.3a); the `wifi.psk`, which is never on the object, only in the withheld `networks` block |
| `POST /network/join` | The foothold in the bootstrap shape, `first`, the inventory with the link item | The key (the browser sent it; the server never echoes it), every other network |
| `POST /network/implant` | The foothold, `first`, the inventory | Hosts (the view is a separate request), every other network |
| `GET /network` | Per foothold, the `networks` blocks of 5.1: names, hosts, `via`, and `down` for a down one. A down network sends only the rows for sessions the player holds there | Every network not in this foothold's reach, entirely. A `psk`, an `ssid` (the view names a network, not its SSID), `downIf` globals (the greyed line says "no route", not which global) |
| Events and globals | `network_joined`, `network_device_refused` (reason `port_security`), `network_implanted`; a Wi-Fi foothold's `<apId>` in `gainedFootholds` | The key is in no event |

**What a tampered browser still gets.** A browser that forges a `GET /network` or a plant can learn
nothing it is not entitled to: the server composes the view from server-held footholds and sessions
only, and refuses a plant at a secured port, a join with a wrong key, and an implant with no server
record. A browser that writes a `downIf` global to `false` can keep a network up that the scenario
meant down; that is why an outage is pacing, not protection, and anything that must stay hidden sits
behind a session the server checks (5.2). A browser cannot read a Wi-Fi key it was never sent, and
cannot pivot to a network without a session the server opened with a password it checked (5.1).

**No-exposure test.** The 9.3a no-exposure test gains: with no foothold and no session, no response
(including `/scenario`, room data, a door `/unlock`, `/network`) contains a Wi-Fi `psk`, an SSID
from a withheld network, a `downIf` global's being read back, or a linked network's name; a secured
jack's plant answers 422 `port_security` and leaves the device; a join with a wrong key is 422 and
reveals no key; after a foothold on network A linked to B, `/network` names B only once a session on
a pivot host is held, and never names a network two hops away across a down link.

## 8. State and saved games

- **New footholds.** `footholds[wifi_<networkId>]` (no `device`) and `footholds[implant_<pcId>]`
  (no `device`) are ordinary foothold records; `held_foothold_ids`, the view and the unplug read
  them unchanged. `gainedFootholds` holds access point ids and the jack ids as before. No new
  `player_state` key: links, outages and Wi-Fi are read from the scenario and the existing
  footholds and sessions.
- **Link items.** A Wi-Fi and an implant foothold each put a link item in the inventory, built by
  `link_item_for` (extended to name the source by its kind: an access point's or the PC's name). It
  comes back in `playerInventory` on load and is rebuilt from the foothold list if lost, exactly as
  a jack's is.
- **Reload.** Footholds, `gainedFootholds` and sessions are kept (9.3a). A Wi-Fi join and an implant
  survive a reload with no re-prompt: their foothold is in the scenario response, so the view opens
  from the link item. An outage is read fresh from the globals each time, so the view after a reload
  reflects the current outage state.
- **Reset.** `footholds` and `gainedFootholds` are dropped (9.3a), so a joined network, an implant
  and a secured-port plant are all undone; `droppedItems` is dropped too, so a `needsDropped`
  implant cannot be re-earned from a stale record.
- **Unplug / leave.** `POST /network/unplug` of a Wi-Fi or implant foothold removes it, returns its
  link item and ends the sessions it carried, as a jack's unplug does. An implant has no device to
  return to the inventory (the device is left in the PC); its link item goes and the foothold ends.
  A Wi-Fi leave returns no device either.

## 9. Validator, schema and dungeon graph

### 9.1 Schema

9.3a reserved every field. This slice only removes the "reserved" descriptions and tightens types:

- `networks.<id>.downIf` (string), `wifi` ({ ssid: string, psk?: string }), top-level `networkLinks`
  (list of two-item lists of strings): descriptions updated, no "reserved" note.
- Objects: `wifiAp` (boolean), `portSecurity` (boolean), `portSecurityMessage` (string).
- The `grant_foothold` action: an entry in the actions schema with `pc`, `needsDropped`,
  `needsSession`, `needsHeld`, `name`.

### 9.2 Validator

The checks stay in `scripts/validate_network.rb` (the file 9.3a added). This slice **removes** the
six reserved-field errors (`NETWORK_RESERVED_OBJECT_FIELDS`, `NETWORK_RESERVED_NETWORK_FIELDS`, the
`networkLinks` error and the `grant_foothold` walk) and adds the real checks. `NetworkModel` gains
the link, outage and Wi-Fi helpers the checks read, so the validator agrees with the server.

Errors:

- a `networkLinks` entry that is not a two-item list of ids that both name a network in `networks`;
- a `wifi` block whose `ssid` is missing or not a string, or whose `psk` is present and not a string;
- `wifiAp` on an object with no network of its own or from its room, or on a sign-in object, or on a
  jack, or on an object with `triggerOnInteract`/`requiresItem`/`locked`/a `lockType` (its click is
  the join), or inside a container or profile;
- `portSecurity` or `portSecurityMessage` on an object that is not a jack;
- a `grant_foothold` with neither `needsDropped` nor `needsSession`, or with both;
- a `grant_foothold` whose `pc` is not a `lockType: "login"` object, or whose `needsDropped`/
  `needsHeld` names no item the scenario defines;
- a `grant_foothold` under `flagRewards` or `eventMappings` (off the server's declared-grant list);
- a `downIf` (network or resource) naming no declared global in `globalVariables` is a **warning**,
  not an error, matching the level 9.2 gives the same mistake;
- a Wi-Fi `psk` that equals an account password (`creds.password`): the key is a lock secret, not a
  reused account password.

Warnings:

- an open share with contents on a network whose `downIf` is truthy by its declared default (it
  starts down, so its contents can be read the moment the outage clears, which may not be the
  intent);
- a Wi-Fi `psk` shorter than eight characters, or one that appears nowhere the player can read.
  Where 9.1 is built this reads `NpcHabits::Clues.readable_texts` (so both slices agree on what the
  player can read), and where 9.2 C is built it adds `feed.posts[].text` to that list;
- a link graph whose shortest path between two networks that a chain needs is longer than eight hops
  (the route cap, 5.1);
- a `grant_foothold` whose PC's USB policy refuses the device's `usbClass` (where 9.2 U is built):
  the implant would always fail at the use;
- a Wi-Fi network with no access point object, and an access point on a network with no `wifi` block;
- a network that is down by default and holds the only route to a host the dungeon graph shows no
  other way to reach (a permanent dead end).

Information lines (with 9.3a's network-reach lines):

- for each network, the networks it reaches over up links, and through which (so an author can see
  the segmentation);
- each Wi-Fi network, its access points, and whether its key appears in a readable text.

### 9.3 Dungeon graph

- An access point is a lock-like node its network's key opens (a Wi-Fi join), with an edge to its
  network, as a jack is for a wired device.
- A link is an undirected edge between two network nodes, labelled "link"; the graph shows it only
  as reachable when both ends are up by default (a down-by-default link is drawn dashed).
- An implant action is a node on its PC with an edge to the PC's network, opened by the dropped item
  (for `needsDropped`) or by the held item plus a session (for `needsSession`).
- A share on a linked network keeps its edges from the admitted accounts' sign-in nodes; the graph's
  reachability walk crosses links so a pivot-only share is not reported unreachable.

## 10. Effects on existing scenarios

No scenario uses `networkLinks`, a network `downIf` or `wifi`, `wifiAp`, `portSecurity`, or a
`grant_foothold` action today (checked across `scenarios/`), so every change is inert until a
scenario opts in. The six 9.3a validator errors this slice removes fired for no scenario (they
guarded reserved fields nobody wrote), so removing them changes no existing result. A scenario with
networks but none of the new fields validates and plays exactly as under 9.3a:
`reach_conditions` with no links returns what it did, the view sends one `networks` block equal to
today's hosts, and no route is a pivot.

### 10.1 `lab_physical_pentest`

The lab's network beat (the drop box, the view, the headless controller) is 9.3a's and this slice
leaves it alone. What this slice offers the lab is the **implant form of the BadUSB beat** (5.5),
which today is a hand-written grant. This is an optional adoption, not required by the slice, and it
is the content plan's and the user's call (section 14). The change, by object and global id:

- `sofia_pc` (today `usb_target_pc` is a plain workstation): make Sofia's PC a `lockType: "login"`
  sign-in host on `office_lan` with Sofia's account and a `host` label, so a foothold on it leads to
  the office network view, and signing in to it needs her password.
- Replace the `grant_remote_session` timer's `give_item` of the hand-written `records_remote_session`
  with a `grant_foothold` on `sofia_pc`, `needsDropped: kit_badusb`, started by the same
  `kp_usb_foothold`. The BadUSB then gives a foothold (the office network, which the player can
  already see from the drop box), and the point the lab teaches moves to the ROE-correct chain: the
  stick gives the network, the account still needs a captured password.
- The malicious cable and plain stick keep their own grants for now (they teach found-media and
  juice-jacking, not a network foothold), or move to `grant_foothold` the same way if the user wants
  one mechanism.

Because the lab already has `office_lan`, a foothold on `sofia_pc` lists the same hosts the drop box
does; the implant is a second way onto the network that needs no comms-cupboard access. This adoption
waits until this slice ships and the lab has one editor (as 9.3a's lab step did). If the user prefers
to leave the lab's BadUSB beat as the hand-written grant (it works and is voiced), this slice ships
without touching the lab, and the implant form is proven only in the feature scenario.

## 11. Tests, and the feature scenario

The testing approach is 9.3a's: unit tests in every step; the feature scenario `test_access_networks`
(built for 9.3a) gains this slice's beats; scripted regression runs through the `window.__test`
bridge with the two checks after every beat (what reached the browser, what the server recorded); the
no-password and no-exposure tests after every step that changes what the server sends; 9.3a's and the
first slice's suite runs wherever a step touches sign-in or the view; `lab_physical_pentest` last and
only if adopted. All browser runs use a keyless server on the builder's own port; nothing touches
:3000. No step runs a database task.

A step is done when its unit tests, the node suite (`bin/test-js`), the Rails suite
(`bin/rails test`), the no-password and no-exposure tests and every suite run built so far pass, and,
for a step that changes client code, the phone reopen check
(`node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`).

### 11.1 Feature scenario beats (`scenarios/test_access_networks`)

Added to the 9.3a scenario (which already has `office_lan`, `workshop_lan`, jacks, hosts, shares and
the P1 to P12 beats). New top-level fields: `server_net` (`downIf: "power_cut"`), `guest_wifi`
(`wifi.ssid` only, open), `staff_wifi` (`wifi.ssid` + `psk`); `networkLinks: [["office_lan",
"server_net"]]`; a resource `secrets_share` on `server_net` with an access list; a secured jack; an
access point for each Wi-Fi network; a dropped-device and a BadUSB beat. Every name a network or
resource shows is six or more characters and appears nowhere else, so the leak check can test it.

| Beat | Set-up | What should happen | Server record afterwards |
|---|---|---|---|
| N1 Port security | a jack `secured_port` on `office_lan` with `portSecurity: true` | Planting the drop box there shows the port-security message, gives no foothold, and the box stays in the tray | No `footholds`; the box still held |
| N2 An outage | `power_cut` false, a foothold on `office_lan`, a session on a pivot host | `server_net` shows in the view through the pivot; after a breaker sets `power_cut`, the view refetches within five seconds and `server_net` is one greyed "no route" line, the held-session row kept | `sessions` unchanged; a desktop fetch on the down host is 403 `unreachable` |
| N3 Restored | clear `power_cut` | The greyed line becomes the network again; the held session's desktop opens with no password | unchanged |
| N4 A link, no pivot | a foothold on `office_lan`, no session yet | The view lists `office_lan`'s hosts and no `server_net` block | one foothold, no sessions |
| N5 Pivot | sign in to the office pivot host with its captured password | `server_net` appears through it, "through <host>, signed in as <name>"; its hosts can be signed in to | `sessions` has the pivot host |
| N6 Shrink | sign out of the pivot host | `server_net` and the onward session are gone from the view | the onward session ended |
| N7 Open Wi-Fi | an access point on `guest_wifi` (no `psk`) | Clicking it joins with no key; its view lists the guest network's hosts | `footholds.wifi_guest_wifi` |
| N8 Keyed Wi-Fi | an access point on `staff_wifi` | A wrong key is refused with no lockout; the right key (from a readable clue) joins; a second access point of the same network answers `already` and still completes its task | `footholds.wifi_staff_wifi`; both APs in `gainedFootholds` |
| N9 Dropped-device implant | a `grant_foothold` on a PC, `needsDropped`; drop the device, an NPC uses it | A foothold on the PC's network arrives; it lists hosts and no session; each host still asks for a password | `footholds.implant_<pc>` |
| N10 Player BadUSB | a `grant_foothold` on a PC, `needsSession` + `needsHeld`, at a PC the player has claimed | Plugging the held device in gives a foothold; the device leaves the inventory; before a session the implant is refused | `footholds.implant_<pc>`; the device not held |

Expected validator output: the Wi-Fi reach lines, the link reach line, the "key appears in a
readable clue" line for `staff_wifi`, and no reserved-field error. The down-by-default warning does
not fire (`power_cut` starts false). No errors.

### 11.2 Unit and node tests

- `test/unit/network_model_test.rb` (extend): `reach_from` across an up link and not across a down
  one; `player_reach` growing through a session and shrinking; `reach_conditions` returning each
  route's `downIf` globals, shortest first, capped at eight, on a graph with a cycle; `truthy?` for
  each value.
- Server controller tests (new files beside 9.3a's): the join route (open, keyed, wrong key, second
  AP `already`, unknown AP, unreachable); the implant route (each shape, each refusal, repeat
  `already`, the device leaving the inventory for `needsSession`, the `droppedItems` read for
  `needsDropped`, the USB refusal where 9.2 U is present); the plant route's port-security refusal;
  the view's `networks` blocks and the down-network rows; the desktop and scoped requests refused on
  a down route and served when up.
- `test/js/validator-network-model.test.mjs` (extend): a fixture per new error and warning, and the
  information lines.
- `test/js/dungeon-graph-networks.test.mjs` (extend): the access point node, the link edge, the
  implant node, a pivot-only share reachable across a link.
- Client tests: the Wi-Fi join flow in `network-links.js` (key prompt, `already`, link item sprite
  from the AP); the view's `networks` blocks and the greyed down rows; the implant trigger; the
  forced sync before a network fetch.

## 12. Build steps, ownership and order

Build in the sub-slice order of section 3 (P, O, K, W, I). Each sub-slice's steps run in the streams
below; a stream is one builder with review rounds after it (`AGENTS.md`: at least two, at most five).
Each sub-slice ends playable and tested, with its feature-scenario beat and a scripted run split from
the building (the scenario's builder writes it and `PLAYTEST.md`; a separate tester runs it).

### 12.1 Shared model first

`NetworkModel` is read by the server, the validator and the dungeon graph, so its new functions
(`reach_from`, `player_reach`, `truthy?`, link and Wi-Fi helpers, the real `reach_conditions`) are
built and committed first, with `test/unit/network_model_test.rb`, before any route or validator
change. The signature of `reach_conditions` does not change, so 9.2's `AccessWork.routes` keeps
working while the body fills in.

### 12.2 Steps per sub-slice

**P (port security).** P-1: `NetworkModel.port_security?`, the plant-route check, the schema and
validator (remove the object reserved-field block, add the two fields and the "not a jack" error),
the client refusal in `network-links.js`. P-2: beat N1, the scenario, the run.

**O (outages).** O-1 (server): `truthy?`, `reach_from`/`player_reach` reading outages, the view's
`down` rows, the desktop/scoped-request route tests, the resource-`downIf` read. O-2 (validator):
remove the network reserved-field block for `downIf`, add the down-by-default warning and the
undeclared-global warning, the dungeon graph's dashed down link. O-3 (client): the five-second
refetch, the forced `syncConfirmed` before network fetches, the greyed "no route" rows. O-4: beats
N2, N3, the scenario, the run.

**K (links and pivot).** K-1 (server): `networkLinks` read into `reach_from`/`player_reach`, the
view's pivot blocks, mapped shares across links. K-2 (validator): the `networkLinks` errors and the
route-length warning, the dungeon graph's link edges and pivot-reachability walk. K-3 (client): the
view's "through <host>" blocks and onward sign-in. K-4: beats N4 to N6, the scenario, the run.

**W (Wi-Fi).** W-1 (server): `POST /network/join`, the `wifi_<networkId>` foothold, the key compare,
the policy and routes. W-2 (validator/schema): the `wifi` and `wifiAp` fields and errors, the short-
key and key-unreadable warnings, the Wi-Fi reach info lines, the dungeon graph's AP node. W-3
(client): the Wi-Fi join in `network-links.js`, the key prompt through the password minigame's key
mode, the AP-sprite link item. W-4: beats N7, N8, the scenario, the run.

**I (implants).** I-1 (server): `POST /network/implant`, the `grant_foothold` declared-grant walk,
the `droppedItems` and session/held checks, the `implant_<pc>` foothold, `usb_refused?` where 9.2 U
is present. I-2 (validator): the `grant_foothold` errors and the USB warning, the dungeon graph's
implant node. I-3 (client): the implant case in `apply-actions.js` and the trigger path. I-4: beats
N9, N10, the scenario, the run; the optional lab adoption (10.1) only on the user's word, as its own
step with the lab's one-editor rule.

### 12.3 Ownership and order table

Files by stream inside this slice. No file is in two streams within the slice.

| Stream | Sub-slice / steps | Owns | Starts |
|---|---|---|---|
| M, model | 12.1 | `lib/break_escape/network_model.rb`, `test/unit/network_model_test.rb` | First, before all routes and validators |
| S, server | P-1, O-1, K-1, W-1, I-1 | `app/models/break_escape/network_access.rb`, the hooks in `app/models/break_escape/game.rb`, `app/controllers/break_escape/games_controller.rb`, `config/routes.rb`, `app/policies/break_escape/game_policy.rb`, `test/controllers/**/network_*`, `test/models/**/network_*` | When M is committed |
| T, tooling and authoring | P-1, O-2, K-2, W-2, I-2 | `scripts/validate_network.rb`, the hooks in `scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `scripts/generate_dungeon_graph.rb`, `README_scenario_design.md`, `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/verify-run.rb`, `systems/test-bridge/access.js`, `docs/test-bridge.md`, their tests | When M is committed (the validator requires it) |
| C, client | O-3, K-3, W-3, I-3, P client | `systems/network-links.js`, `api-client.js`, `minigames/network-view/network-view-minigame.js`, `minigames/password/password-minigame.js` (key mode reuse), `systems/apply-actions.js` (implant case), `core/game.js`, and their `test/js/` files | Against the route shapes in section 6 (node tests stub the API); browser checks when S is in |
| F, feature scenario | each sub-slice's last step | `scenarios/test_access_networks/**` | When S and T for that sub-slice are committed |
| L, lab (optional) | I-4 | `scenarios/lab_physical_pentest/**`, its tests | Only on the user's word (10.1, 14), one editor |

### 12.4 Files shared with 9.2 L and C, being built now

9.2's sub-slices L and C are in flight (branches `build/9-2-l`, `build/9-2-c`, both from the H head).
The plan order is **9.2 fully, then 9.3b**, so on every shared file 9.2's edits land first and a
9.3b builder re-reads the file just before editing, edits only its own block, never reformats, and
commits with explicit paths. The files this slice shares, with the order on each:

| File | Also edited by | Order and why |
|---|---|---|
| `app/models/break_escape/game.rb` | 9.2 L (`check` report, owner claim while locked out), 9.2 C (`reveal_feed_post!`, feed facts); engine E4 (`add_item_to_room!`, capture methods) | 9.2 L and C, then this slice. Different methods: this slice adds the implant hooks and `usb_refused?` beside `effective_policy`, and reads `droppedItems` that E4 already writes. Re-read `ACCESS_STATE_DEFAULTS` (no new key here) |
| `lib/break_escape/access_work.rb` | 9.2 L (the `maxAttempts` clause), 9.2 C (the feed fact list) | 9.2 L and C, then this slice. This slice reads `AccessWork.plant_refused?` for the implant's USB check and does not edit the file unless `usb_refused?` is placed here; place it in `game.rb` beside `effective_policy` as 9.2's plan says, so `access_work.rb` is read-only to this slice |
| `app/controllers/break_escape/games_controller.rb`, `config/routes.rb` | 9.2 C (its `feed_post` route), 9.2 L (none) | 9.2 C, then this slice; each adds its own route and action lines |
| `app/policies/break_escape/game_policy.rb` | 9.2 C (its route's policy) | 9.2 C, then this slice; each adds its own methods |
| `scripts/validate_scenario.rb`, `scripts/scenario-schema.json` | 9.2 C (its checks), 9.2 L (none) | 9.2 C, then this slice; each appends its own block. This slice only edits the `networks`/`resources` field descriptions already present and the actions schema |
| `scripts/validate_network.rb` | nobody (9.3a's file; 9.2 uses `validate_access_work.rb`) | This slice alone |
| `scripts/generate_dungeon_graph.rb` | 9.2 (its work nodes) | 9.2, then this slice |
| `systems/apply-actions.js` | engine E4 (the `objectId` option, `remove_item`), 9.2 (not) | E4, then this slice adds the `grant_foothold` case |
| `systems/network-links.js`, `minigames/network-view/**`, `minigames/password/password-minigame.js`, `api-client.js` | 9.2 (not; 9.2 C touches the osint browser, not these) | This slice alone among the slices in flight |
| `tools/playtest/lib/access_leak_scanner.rb`, `verify-run.rb` | 9.2 (its own rules) | 9.2, then this slice adds the Wi-Fi-key rule |
| `README_scenario_design.md` | 9.2 (its section), engine streams | Each owns its own section; this slice extends 9.3a's "Networks" section |

Review and playtests follow `AGENTS.md`: adversarial review rounds of this plan before any build, an
implementation review after each stream, and the scripted runs listed in the steps.

## 13. Interfaces with other plans

### 13.1 Slice 9.2 (work, frustration, USB policy, social media)

- **Reach for NPC work.** 9.2's `compile_npc_plan!` calls
  `NetworkModel.reach_conditions(data, station_network, resource)` and ships the answer as `routes`;
  this slice fills in the real routes (links and outages) without changing the signature or shipping
  a network name. 9.2's `reachable(need, globals)` already reads a route's `downIf` globals and its
  kick and forced sync already watch every route global, so no 9.2 client change is needed.
- **The USB check on an implant.** 9.2's plan says 9.3b adds `usb_refused?(pc, item)` beside
  `effective_policy`, reading 9.2's table, with a validator warning for a `grant_foothold` whose PC
  refuses its device. This slice builds it (sub-slice I). The refusal is at the use, never at the
  drop. If for any reason 9.2 U is not built when this slice lands, the implant route skips the USB
  check and the validator warning is omitted, and both are added when 9.2 U lands.
- **Outages.** A `downIf` on a network or a resource means the same in both: the global truthy, by
  `truthy?`, means down. This slice owns what an outage does to the player's reach; 9.2 owns what it
  does to NPCs. An object that is off is office life's `affordance.offWhen` in both.
- **A station seen from the network.** 9.2 left "a sign-in host whose `affordance.offWhen` holds
  listed 'not responding' in the view, and refused in `desktop_request_allowed?`" to 9.3b, built
  with the player's outages. This slice adds both: a host on a down network, or whose own `offWhen`
  holds, shows "no route" / "not responding" and is refused on the route test (5.2).
- **The feed as a Wi-Fi key source.** Where 9.2 C is built, the "key appears nowhere" warning reads
  the list 9.2 C adds `feed.posts[].text` to (9.2's `Clues.readable_texts` additions).

### 13.2 Slice 9.1 (awareness and habits)

- The Wi-Fi key's home is `networks.<id>.wifi.psk`. Whichever of 9.1 and this slice lands second adds
  it to `NpcHabits::Clues.secret_homes` for 9.1's `reused` check. In the built order 9.1 is already
  merged, so this slice adds it.
- The "key appears nowhere" warning reads `NpcHabits::Clues.readable_texts` (built), so both slices
  agree on what the player can read.
- A written-down password is never shown on a remote sign-in screen (9.3a), and a Wi-Fi key is a lock
  secret said in readable text, not a sticky note; the two channels do not meet.

### 13.3 The engine feedback plan

- The link item for a Wi-Fi or implant foothold is the 9.3a link item shape, built by the server and
  filed by `storeIn` when its source sets one (the capture log's rule). A Wi-Fi foothold's source is
  an access point; an implant's is a PC; neither has a `linkStoreIn`/`linkName` field of its own in
  this slice, so the link item takes a tray slot unless a future field adds one.
- The implant's `needsDropped` check reads E4's `droppedItems` and adds no record of its own, exactly
  as the 9.3a plan reserved (section 2).

### 13.4 The device pitch

- The Wi-Fi Pineapple's foothold-over-Wi-Fi is sub-slice W; its captured-portal credential is the
  social engineering lab's capture, not this slice.
- The switch drop box is 9.3a's. The player's BadUSB (pitch device 3) is sub-slice I's `needsSession`
  implant.
- The defender's sweep and the SIEM beacon (pitch devices 9, 10) are left out (section 15);
  `network_device_planted`, `network_joined` and `network_implanted` are the hooks.

## 14. Open questions for the user

Each has a recommended answer; the plan is written as if the recommendation is taken.

1. **Does the lab adopt the implant form of the BadUSB beat now (10.1), or keep its hand-written
   grant?** *Recommend: build and prove the implant in the feature scenario this slice, and offer the
   lab adoption as a separate, later step on your word.* The lab's beat works and is voiced; changing
   it re-touches a shared file and may need re-voicing Ruth's debrief, so it should be a deliberate
   choice, not bundled into the engine slice.
2. **Is a Wi-Fi join a foothold with no device (as written), or should joining consume a "Wi-Fi
   adapter" item for symmetry with the drop box?** *Recommend: no device.* The server cannot check
   range or an adapter, a key the server compares is the real gate, and an item adds inventory
   friction for no lesson.
3. **Should the player's own BadUSB implant (`needsSession`) need a claimed/unlocked screen, or also
   accept a remote session the player opened?** *Recommend: a claim or a local password sign-in only,
   never a session opened through a foothold* (as written), so the player cannot implant a PC they
   only reached remotely, which keeps "plug in at a desk" physical and the chain honest.
4. **Port security: refuse only (as written), or add a bypass beat (spoof a known MAC) later?**
   *Recommend: refuse only this slice.* A bypass needs a new minigame and a secret; the teaching
   point (the control works) lands with the refusal, and a bypass can be its own later beat.
5. **Does a down network's held-session row stay visible greyed (as written), or disappear until the
   route returns?** *Recommend: stay visible greyed with "no route".* A session that silently
   vanishes reads as a bug; a greyed row tells the player the session is still theirs and the network
   is down.

## 15. Left out, on purpose

- **Per-service firewall rules and one-way links.** A link exists or it does not, and a pivot crosses
  it in both directions.
- **Wi-Fi range and client devices.** The server cannot check range.
- **A bypass for port security.**
- **A lockout on repeated wrong Wi-Fi keys.** It needs a counter, a clock and a saved key for an
  attack only a scripted client makes. The validator warns about a short key instead.
- **Detection.** NPCs noticing a planted or joined device, an alarm on failed remote sign-ins, the
  defender's sweep and the SIEM beacon. The events are the hooks.
- **`requiresReach` on objects and VM launchers**, and the bridge to SecGen VMs. When wanted, the
  server-side "does the player reach network N" is `player_reach` for any held foothold, and the
  client list is in `network-links.js`.
- **An implant that hands over a session.** Built from checked pieces: an implant for the network and
  a captured password for the account (5.5).
