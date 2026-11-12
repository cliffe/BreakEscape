# Dungeon graph for slice 9.3b: build log

Plan: `ACCESS_MODEL_SLICE_9_3B_PLAN.md`, sections 9.3 and 9.4. Branch `build/graph-net`.

## What the graph draws now

Everything is read through `BreakEscape::NetworkModel`. The script does not parse links, reach or
implants itself. The pivot rule follows the server's reach walk (`NetworkAccess#reach_walk`).

- **Link**: one dashed, undirected line (`-.-`) between the two network nodes, labelled `link`,
  with `soft: true` and `undirected: true` in the JSON. A link is structure: a foothold reaches only its
  own network, so following solid arrows never crosses a link. No other edge carries `undirected`.
- **Pivot**: an AND gate `pivot_<host>` for each sign-in host. Its inputs are the host's network
  (reached) and the host's sign-in lock (a session held there). It has a `pivot` edge to each network
  **directly** linked to the host's network (`linked_networks`), one hop per host, as the server
  walks it. A network two links away needs a second host on the middle network. Pivots are drawn
  only from networks a foothold can reach (an open jack, an access point or an implant, then the
  same one-hop walk), so a walk-up session alone shows no reach.
- **Wi-Fi**: each access point (`wifi_aps`) is a lock node `wifiap_<id or path>`, from its room,
  with an edge to its network. The key is a key node `wifikey_<network>` fed by each readable text
  that holds it (`NpcHabits::Clues.readable_texts`), hung where the player finds it: behind a
  container's lock (the habits section's `clue_node_for`, now shared), from the NPC who holds it,
  from a PC's desktop, or from the start room. A text with no place (ink, a profile, social content)
  is a dashed edge from the start room. An open network has no key node.
- **No label prints a Wi-Fi key**: an SSID or name that contains a key is replaced by the network
  name or the object id, and this applies in every tab, Rooms & Contents included.
- **Implant**: one lock node `implant_<pc>` per PC, for the actions `grant_foothold_actions`
  returns. Names are joined when a PC has both shapes. It has these edges:
  - from where its action runs: the host prop's room or lock, labelled `at <prop>`; a timer, as a
    dashed edge from the start room labelled `timer: <trigger>`; or an NPC;
  - from the device, labelled `held` or `dropped`. The device is found as the server finds it (id,
    then type, then name, across room objects, start items, NPC items and declared grants);
  - from the PC's sign-in, labelled `session at PC`, for the session shape;
  - to the PC's network, once.
  A session implant on a headless PC is labelled unusable and has no session edge.
- **Outage**: the network node's label gains `down while <global>`, plus `(down at start)` when
  the declared starting value is truthy by `NetworkModel.truthy?`. There is no gate node.
- **Port security** (any truthy value, as the server reads it): the jack's label says so, and it
  has no edge to its network.
- **Legend**: graphs that use links, pivots or implants get extra legend lines in the HTML and edge
  notes in the Markdown. Other graphs keep their legend byte for byte.
- Labels use an authored value only when it is a non-blank string, else the id.

## Tests

`test/js/dungeon-graph-networks.test.mjs` has 23 tests for 9.3b (28 in the file, all passing).
They cover links (JSON, Mermaid line and legend), the pivot gate, the one-hop rule, no pivots
without a foothold, the Wi-Fi key (placed, in a locked safe, held by an NPC, a start item, open
network, id-less access points), the key absent from all three outputs even when the SSID and a
note name hold it, implants (host edges, a locked room, a timer, a device named by type, both
shapes, headless), the outage, port security, malformed input, and a clean fixture with every field.
Each test that asserts an absence also has a positive control.

## Every existing scenario

Graphs were generated for all 176 `scenario.json.erb` files before and after the change and the
`.json`, `.md` and `.html` outputs compared byte for byte: only `scenarios/test_access_networks`
changed (the only scenario using the new fields). Its committed graph was already stale before
this change and is regenerated here. The 63 untracked graph files the sweep created elsewhere were
removed.

## Live check

Rendered the puzzle tab of `scenarios/test_access_networks/dungeon_graph.html` in headless
Chromium and looked at it. After review R1 there are 47 nodes, and no two node boxes overlap. The
server network now sits below the office LAN, and its pivots come down through the `+` gates.

## Review R1

`DUNGEON_GRAPH_9_3B_CODE_REVIEW_R1.md`: B1, M1 to M4, m1 to m8, n1 and n2 are fixed as described
above. n3 (layout) is improved by the gates and the dashed link. One reverse pivot remains: the file
server's gate back to the office LAN, which the server allows. n4: the sweep shows that nothing
else changed, but it does not show the drawing is correct. The fixtures do that.

## Review R2

`DUNGEON_GRAPH_9_3B_CODE_REVIEW_R2.md`, fixed in commit d4c7abb9d.

- **M1**: an access-listed file share (not listed only) is reached from an admitted account's
  sign-in when a host on any network in the share's link component admits that account, as
  `mapped_shares` walks `networks_reachable_from` with no pivot or foothold. Other access-listed
  resources keep the own-network rule, and an open share still hangs only from its own network.
  The legend line now reads "crossed by a pivot, or by a signed-in desktop mapping an
  access-listed share".
- **M2**: every output is scrubbed at write time (`scrub_wifi_keys`): each key, in its plain,
  HTML-escaped, JSON-escaped, JS-template and node-id forms, becomes `WIFI_KEY_HIDDEN`, a token
  valid both in a Mermaid id and in a label. `safe_text` still keeps readable labels.
- **m1**: text files in a resource's contents are key sources, hung from `resource_<id>`.
  `NpcHabits::Clues.readable_texts` itself does not walk resources, so the validator's "key
  appears nowhere the player can read" warning can still fire falsely: that is for the
  validator owner.
- **m2**: items an NPC holds are indexed at any depth, and the NPC (by id, then by path) is
  checked before the room branch.
- **m3**: tests for the reverse pivot and for a share reached across a link.
- **n1**: a jack seeds pivots only when a rogue device exists. **n2**: an access point hangs
  from its own or its container's lock, as an implant's prop does.
- **n3** left: one label pair (`session at PC` and `at Door controller USB port`) still overlaps
  beside Store. Both edges enter the same implant node from nearby sources, and edge order does
  not steer Mermaid's label placement. **n4** left, as the review advised.

Suites: Rails 1796 runs, 0 failures, 0 errors (1 skip); JS 507 of 507 files pass.

Tests: 35 in `dungeon-graph-networks.test.mjs`, all passing (7 new: reverse pivot, jack with no
device, share across a link, nested NPC item, key in a share, access point in a locked
container, the key scrubbed from an NPC name, a container name and an objective and task title).
Sweep: all 176 scenarios generated with `main`'s script and this one. Only
`test_access_networks` differs. Against its graph from the previous commit, only the legend
line changed. Render: 47 nodes, no overlapping
node boxes, no Mermaid error.
