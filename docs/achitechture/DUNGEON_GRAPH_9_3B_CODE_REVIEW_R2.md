# Dungeon graph for slice 9.3b: code review, round 2

Branch `build/graph-net` against `main` (head 991fc9c1c). Plan sections 9.3 and 9.4 of
`ACCESS_MODEL_SLICE_9_3B_PLAN.md`; build log `DUNGEON_GRAPH_9_3B_BUILD_LOG.md`; round 1
`DUNGEON_GRAPH_9_3B_CODE_REVIEW_R1.md`.

Counts: 0 blocker, 2 major, 3 minor, 4 nit.

## How this was checked

- Read the diff, `lib/break_escape/network_model.rb` and, in
  `app/models/break_escape/network_access.rb`, `reach_walk` (810-841), `reach_session_hosts`,
  `networks_reachable_from` (857-871), `mapped_shares` (987-1006), `implant_foothold!`,
  `find_wifi_ap`, `port_security_refusal` and `desktop_request_allowed?`.
- `node --test test/js/dungeon-graph-networks.test.mjs`: 28 of 28 pass.
- Regenerated `test_access_networks` in a scratch copy: the output matches the committed files
  apart from the directory name. The psk string occurs in none of the three committed files.
- Generated 27 scenarios (25 picked at random, plus `test_needs_sims` and
  `test_access_networks`) with `main`'s script and the branch's: only `test_access_networks`
  differs, as the build log says.
- Ran 12 hand-made fixtures against the generator (results quoted under each finding).
- Rendered the puzzle tab of `scenarios/test_access_networks/dungeon_graph.html` in headless
  Chromium: 47 nodes, no Mermaid error, no overlapping node boxes.

## Round 1 findings

| R1 | Status | Evidence |
|----|--------|----------|
| B1 two-hop pivot | Fixed | `linked_networks` per host. Fixture A-B-C with no host on B: C has only the dashed `link` edge in, no pivot. |
| M1 pivot from the lock alone | Fixed | `pivot_<host>` gates fed by `net_<host net>` and `lock_<host>`; drawn only for networks a foothold source reaches. |
| M2 link as a route | Fixed | `-.-` with `soft: true, undirected: true`; no other edge has the key. |
| M3 key in a locked safe | Fixed | Hung through `clue_node_for` and the safe's lock. NPC-held items hang from the NPC (but see m2). |
| M4 implant host ignored | Fixed | `host_from` draws the prop's room or lock, a timer (dashed) or an NPC beat. |
| m1 to m8, n1, n2 | Fixed | Checked each in the diff and the tests. m1 holds only inside the network section (see M2 below). |

### The reverse pivot

Confirmed. `linked_networks` is undirected (`network_model.rb:190-199`), and `reach_walk`
expands from every session host on a reached, up network to its linked networks, whatever the
direction. So a session at `sv_fs02` on `server_net` does add `office_lan`. In
`test_access_networks` the edge adds nothing, because `server_net` is reached only from
`office_lan`. With a foothold whose own network is `server_net` (fixture: the jack moved onto
`server_net`, a sign-in host there), the gate `pivot_spc -> net_office_lan` is the only way in,
and the server agrees. Correct as drawn.

## Major

### M1. A share mapped across a link is missing: a desktop session maps it with no pivot

`scripts/generate_dungeon_graph.rb:600-605` (the 9.3a share code, unchanged here) draws an
access-listed share from `signin_<account>` only when a host **on the share's own network**
admits that account. Since 9.3b, `mapped_shares` (`network_access.rb:987-1006`) maps every
access-listed `file_share` on any network in `networks_reachable_from(pc network)`, which is
**transitive over up links and needs no session on the networks in between, and no foothold**.
A walk-up sign-in at a finance PC on `office_lan` therefore maps an access-listed share on
`server_net`, or on a network several links further on.

Fixture: `office_lan`-`server_net` link, `fin_pc` on `office_lan` admitting `finance`, share
`vault` on `server_net` with `access: { roles: ['finance'] }` and no host on `server_net`. The
server maps the vault on Lena's desktop at `fin_pc`. The graph gives `resource_vault` no
incoming edge at all, so it reads as unobtainable. This is a route the server allows and the
graph misses. The new legend line "link: two networks joined; crossed only by a pivot"
(`:1705`) also misstates it.

Fix: in the share loop, admit an account when any sign-in host on a network in the share's
link component (the same transitive walk `networks_reachable_from` does, ignoring outages as
the other edges do) admits it, not only hosts on the share's own network. Keep the open-share
case as it is: `mapped_shares` maps an open share only on the PC's own network. Reword the
legend line to "crossed by a pivot, or by a signed-in desktop mapping an access-listed share".
Add a test with the fixture above.

### M2. The Wi-Fi key still prints when it is in a name the network section does not draw

The brief for this graph is that the key appears in no output, and the build log says the rule
"applies in every tab, Rooms & Contents included". `safe_text` (`:531`) covers the labels the
9.3b code writes, and `walk_room_contents` covers that tab's object names, but every other
label path prints authored names untouched. Psk occurrences across the three files, from
fixtures with the key in one other name each:

- an NPC display name: 7;
- a locked container's name (drawn by the main lock walk): 5;
- an objective or task title (Story tabs): 4;
- a room name and a note named after the key in the puzzle walk: 0.

Authors are unlikely to write the key into these names, but the claim is absolute and the
check is cheap. Fix: scrub once, at write time. Before the three `File.write` calls (`:1929`,
`:2025`, `:2030`) replace every occurrence of each `WIFI_KEYS` string in the HTML, Markdown
and JSON text with `[Wi-Fi key]` (for the JSON, scrub the node labels and edge labels before
`JSON.pretty_generate`). Keep `safe_text` for readable labels. Extend the "key never reaches an
output" test with an NPC name, a container name and a task title holding the key.

## Minor

### m1. A key kept in a file share's contents has no source

`NpcHabits::Clues.readable_texts` does not walk `resources[*].contents`, so a key in a text
file on a share gives `wifikey_<net>` no incoming edge (fixture: open share on `office_lan`
whose text file holds the key). The server serves that file to anyone reaching the network, so
the graph shows the key as unobtainable when it is not. The validator's "key appears nowhere
the player can read" warning reads the same list and would fire falsely too. Fix: in the graph,
also scan `nm.resources` contents for the psk and hang a clue from `resource_<id>`; propose the
same addition to `readable_texts` to the validator owner.

### m2. A key note nested inside an NPC-held item is drawn lying in the room

`npc_holder` (`:640-650`) indexes only the top-level `itemsHeld` ids. A note inside a folder the
NPC holds has `t[:room]` set, so it falls through to `clue_node_for` (`:692`) and is drawn
`lobby -> clue_inner -> wifikey_guest` (fixture), as if it lay in the open. Fix: match the
holder by the text's path (`rooms/<id>/npcs[<i>]/itemsHeld...`) with `npc_at_path`, before the
`t[:room]` branch, rather than by object id.

### m3. Two server rules have no test

There is no test of the reverse pivot (a foothold on the far network pivoting back), which the
build log calls out as intended, and none of a share reached across a link (M1). Add the
fixtures used in this review: the jack on `server_net` with a host there, asserting
`pivot_<host> -> net_office_lan`; and M1's vault.

## Nit

### n1. A jack seeds pivots when no rogue device exists

`foothold_nets` (`:622`) counts every jack without port security, even when the scenario has no
rogue device to plant. Fixture with the device removed: `pivot_fin_pc` is still drawn and the
jack still has `comms -> jack_port -> net_office_lan`. The jack edge is 9.3a's; the validator is
the right place to flag a jack with no device, but the pivot seed could skip jacks when
`device_nodes` is empty.

### n2. An access point inside a locked container hangs from the room

`find_wifi_ap` requires `object_reachable?`, which checks the containers above the access
point. The graph draws `room -> wifiap_*` only. Using the implants' `object_from` for the access
point would match the server. Unlikely in a real scenario.

### n3. Edge labels collide in the render

In the `test_access_networks` puzzle tab, `session at PC` (kiosk to `BadUSB: kiosk`) runs
across most of the canvas and its label lands beside `Guest-Notice`, far from either end; the
`session at PC` and `at Door controller USB port` labels overlap beside `Store`. Legible after a
zoom, and Mermaid's layout is hard to steer, so no change is needed unless a cheap reorder of the
implant edges helps.

### n4. The reverse pivot adds a long edge that changes nothing in this scenario

`pivot_sv_fs02 -> net_office_lan` is correct (see above) but redundant here and loops round the
right edge of the canvas. Leave it: hiding redundant pivots would need the graph to reason
about which network was reached first, and a future scenario with a foothold on `server_net`
needs the edge.
