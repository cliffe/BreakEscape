# Dungeon graph for slice 9.3b: code review, round 1

Branch `build/graph-net` against `main` (commit 9b1b89397). Plan sections 9.3 and 9.4 of
`ACCESS_MODEL_SLICE_9_3B_PLAN.md`; build log `DUNGEON_GRAPH_9_3B_BUILD_LOG.md`.

Counts: 1 blocker, 4 major, 8 minor, 4 nit.

## How this was checked

- Read the diff, `lib/break_escape/network_model.rb` and the server walk in
  `app/models/break_escape/network_access.rb` (`reach_walk`, `implant_foothold!`,
  `port_security_refusal`, the Wi-Fi join).
- Ran `test/js/dungeon-graph-networks.test.mjs` on the branch (17 of 17 pass) and against
  `main`'s script and lib with the branch's test file (8 of the 12 new tests fail; tests 7, 9, 12
  and 14 pass on `main` too).
- Ran the generator on 14 hand-made malformed scenarios (links as a string, junk link entries, a
  string `wifi` block, non-string ssid and psk, id-less access points, junk `grant_foothold`
  actions, odd `downIf` and `globalVariables`, a hostile network id). None crashed; the wrong
  drawings they produced are listed below.
- Repeated the before/after sweep of all 176 `scenario.json.erb` files in scratch copies: only
  `test_access_networks` changes, and the committed graph on `main` was already stale. The build
  log's claim holds.
- Searched every output (`.json`, `.md`, `.html`) of `test_access_networks` for the Wi-Fi key:
  no match.
- Rendered the puzzle tab of `scenarios/test_access_networks/dungeon_graph.html` in headless
  Chromium: 42 nodes, no Mermaid error, labels legible.

## Blocker

### B1. A pivot edge is drawn to networks two or more links away; the server never reaches them from that host

`scripts/generate_dungeon_graph.rb:610` builds `bridged` from `nm.reach_paths(...)`, which is
every network connected over any number of links. The server's walk
(`app/models/break_escape/network_access.rb:825-834`) expands only from a host at which the player
holds a session, and only to that host's **direct** `linked_networks`. With links A-B and B-C, a
session at a host on A adds B, never C; C needs a second session at a host on B. With no sign-in
host on B, C is unreachable, yet the graph draws `lock_pc_a -> net_c (pivot)` (reproduced with a
three-network chain fixture). The test at `test/js/dungeon-graph-networks.test.mjs:138` ("two links
away is still bridged") asserts the wrong behaviour, and the build log
(`DUNGEON_GRAPH_9_3B_BUILD_LOG.md:14`) states it as matching `structural_reach`.

Fix: use `nm.linked_networks(scenario, net_id)` in place of the `reach_paths` filter, so each pivot
edge is one hop; a longer route then shows as a chain through a host on each intermediate network.
Change the test to assert `lock_hot_desk` has **no** edge to `net_archive_net`, and add one where a
host on `server_net` carries the pivot on to `archive_net`. Correct the build log line.

## Major

### M1. A pivot edge hangs from the host's sign-in lock alone, so a walk-up session looks enough

`scripts/generate_dungeon_graph.rb:613-615`. The server's walk seeds from the foothold's own
network and expands from a session host only when that host's network is already reached
(`network_access.rb:827`). A walk-up session at the finance PC with no foothold reaching the office
LAN reaches nothing. In the graph the sign-in lock has an incoming edge from its room, so tracing
"walk to the desk, sign in, follow `pivot`" reaches the server network with no jack, AP or implant.
It is also drawn for hosts whose network has no foothold source at all.

Fix: make each pivot an AND: one gate node per host (`add_node("pivot_#{nid(host)}", '+', 'gate')`),
fed by `net_<host network>` and `lock_<host>`, with the `pivot` edges leaving the gate. That says
"reach this network and hold a session here". Add a test that the pivot target is not reachable from
the room through the lock alone (assert the gate has both inputs).

### M2. The link edge reads as a route; the plan says a link is not one

`scripts/generate_dungeon_graph.rb:604`, `:1411` and `:1886`. A link is drawn as a solid two-way
edge between network nodes. Plan 4.1: a foothold "still reaches only its own network"; the linked
network is reached only by pivoting. Following solid arrows `jack_comms_port -> net_office_lan ->
net_server_net` claims the server network from a bare jack, which the server refuses. JSON readers
(the playtest skill reads `soft: false` as a hard dependency) see a hard edge too, and `both` is
documented nowhere a reader would look.

Fix: draw the link as structure, not reach: `dashed: true` (soft in JSON) and an undirected Mermaid
line (`-.-` with the label) rather than `<-->`. With M1's gates the pivot carries the reach. Document
the link line in the legend (see m8).

### M3. A Wi-Fi key inside a locked container is drawn as lying in the open room

`scripts/generate_dungeon_graph.rb:639-650` ignores `t[:locks]`. A card holding the key inside a
PIN safe in the lobby gives `lobby -> clue_card -> wifikey_g` with no edge through `lock_safe`
(reproduced). The graph claims the key before the safe is open. A text held by an NPC
(`itemsHeld`) is also drawn straight from the room, though the NPC has to hand it over.

Fix: reuse the habits section's `clue_node_for` (`:398-412`), which hangs a clue from the innermost
container lock. It is a lambda inside the habits `if`; lift it (and `container_lock_node_for`) into
a method both sections call, and keep the PC-scope branch from `:640`. Add a test with the card in a
locked safe asserting `lock_safe` lies on the path to `wifikey_*`.

### M4. An implant ignores where its action runs

`scripts/generate_dungeon_graph.rb:674-689`. The server grants the foothold only when the client
posts after the action fires, and the action fires from its host (a desk-side prop's
`triggerOnInteract`, a timer, an NPC beat). The graph draws only device and session edges, so a
prop in a locked room, or an NPC beat gated behind a lock, is missing from the implant's
requirements and the implant looks reachable early.

Fix: derive the host from `act[:path]` (`rooms/<id>/objects[i]...` gives the room; a timer or NPC
path gives that node) and add an edge from the host's room, or the host's lock when it has one, to
`implant_<pc>`. Test with the prop in a locked room.

## Minor

### m1. The key can still reach a label

`scripts/generate_dungeon_graph.rb:637` prints the SSID; `:647` prints the clue object's name. When
the SSID equals or contains the key (reproduced with `ssid == psk`), or a note is named after the
key, the key is in the `.json`, `.md` and `.html`. Fix: if `ssid.include?(psk)` use the network
name; if a clue name includes the key, use the object id. Add a test that the psk string occurs
nowhere in any of the three output files (not only the key node's JSON label).

### m2. Key sources the validator counts are not drawn

`scripts/generate_dungeon_graph.rb:640-645` keeps only texts with a `:room` or a PC scope. A key
found only in ink, a start item, an account profile, a feed post or social content gives a key node
with no incoming edge, while `validate_network.rb:215` treats those as readable. Fix: draw start
items from the start room (as the rogue-device code does), profile texts from the profile's sign-in
node, and ink or feed texts from the NPC's node when one exists; otherwise add the key from the
start room with `dashed: true` so it is not shown as unobtainable.

### m3. Implant devices found only among room objects, and only by id

`scripts/generate_dungeon_graph.rb:660-672`. A `needsHeld` device in `startItemsInInventory`, an
NPC's `itemsHeld` or a declared grant becomes a floating key node. The server
(`network_access.rb:386-392`) also matches by `type` or `name`, so a type-named `needsHeld` draws
an orphan `device_<type>` (reproduced). Fix: resolve the device with the same homes
`rogue_device_definitions` uses (room, container, start, npc, grant) and match id, then type, then
name, as the server does.

### m4. Duplicate implant edges and a first-wins label

`scripts/generate_dungeon_graph.rb:677` and `:689`. A PC with both shapes (allowed, one per
`[pc, shape]`) gets `implant_<pc> -> net` twice (reproduced), and the node takes the first action's
name only. Fix: add the network edge once per node (check `$edges` or keep a set); join the names
when they differ.

### m5. A session-shape implant on a headless PC is drawn as possible

`scripts/generate_dungeon_graph.rb:681`. The server needs a session with a blank `foothold`
(`network_access.rb:427`): a claim or a keyboard sign-in. A headless PC only takes a remote sign-in,
which writes a foothold, so the implant can never be granted; the graph still links its lock to the
implant through the network's `exposes` edge. Fix: skip the `session at PC` edge and mark the
implant label "(unusable: headless)" when `nm.headless?(pc[:object])`; consider a validator error
too (propose it to the validator owner).

### m6. Access points without an id collide

`scripts/generate_dungeon_graph.rb:626`. Two id-less, name-less access points on one network both
become `wifiap_wifi_ap`, with duplicate edges (reproduced). Fix: fall back to the room-object path
(`nid(entry[:path])`) as the node id when there is no id.

### m7. Four new tests pass without the change, and none checks the Mermaid or malformed input

`test/js/dungeon-graph-networks.test.mjs:125`, `:143`, `:181` and `:215` assert only absences, so
they pass on `main`. Fix: give each a positive control on the same fixture (for example, `:215`
also asserts `implant_hot_desk` is drawn; `:181` asserts the jack still is). Add one test that reads
`dungeon_graph.md` for the link line, and one that runs a malformed fixture (junk `networkLinks`,
string `wifi`, junk `grant_foothold`) and asserts exit 0 with no new nodes, since the validator
runs the graph and a crash there is reported only as "generation failed (non-fatal)".

### m8. The legend omits the link and pivot edges

Build log "Not done" (`DUNGEON_GRAPH_9_3B_BUILD_LOG.md:56`). The stated reason, that a legend line
would rewrite every scenario's graph, does not hold if the line is emitted only when `NETWORKS.any?`
(next to the existing legend at `scripts/generate_dungeon_graph.rb:1673`). Fix: add conditional
legend and Markdown edge-note lines for the link line, `pivot`, `held`, `dropped` and
`session at PC`.

## Nit

### n1. `portSecurity` compared with `== true`

`scripts/generate_dungeon_graph.rb:559`; the server refuses on any truthy value
(`network_access.rb:112`). Only schema-invalid data differs (the schema says boolean). Fix: use
truthiness, to match the server.

### n2. Non-string labels print as Ruby hashes

A hash network `name`, action `name` or object `name` renders as `{"x"=>1}`
(`scripts/generate_dungeon_graph.rb:525`, `:637`, `:647`, `:677`). Fix: use a value only when
`nm.present_string?`, else the id.

### n3. Readability of the network corner

The render is legible, but the two-way link and the reverse pivot (`lock_sv_fs02 -> net_office_lan`)
put the server network above the office LAN, so its four pivot edges run upwards and cross the
`exposes` fan. B1, M1 and M2 together should tidy this; if reverse pivots stay, draw them only when
a foothold source (jack, AP, implant) is on the host's network.

### n4. The sweep shows no regression, not correctness

The before/after comparison is sound (reproduced: only `test_access_networks` differs, and `main`'s
committed graph was stale), but it covers one scenario using the new fields. It cannot catch B1 or
M1 to M4; the fixture tests have to. Worth saying so in the build log.
