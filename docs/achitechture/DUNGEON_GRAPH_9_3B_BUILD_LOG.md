# Dungeon graph for slice 9.3b: build log

Plan: `ACCESS_MODEL_SLICE_9_3B_PLAN.md`, sections 9.3 and 9.4. Branch `build/graph-net`.

## What the graph draws now

All of it is read through `BreakEscape::NetworkModel`; the script does not parse links, reach or
implants itself.

- **Link**: one two-way edge between the two network nodes, labelled `link`
  (`network_links`). The edge carries `both: true` in `dungeon_graph.json` and is drawn `<-->` in
  Mermaid. Other edges carry no `both` key, so their JSON is unchanged.
- **Pivot**: from each sign-in host to every network its own network reaches over links,
  labelled `pivot` (`sign_in_objects_on`, `reach_paths`). Two links away still counts, as in the
  server's `structural_reach`. No links, no pivot edges.
- **Wi-Fi**: each access point (`wifi_aps`) is a lock node `wifiap_<id>`, from its room, with an
  edge to its network. The network's key is a key node `wifikey_<network>` labelled with the SSID
  (never the key), fed by every readable text that contains the key
  (`NpcHabits::Clues.readable_texts`, the same text walk the habits section uses). An open
  network (no `psk`) has no key node.
- **Implant**: one lock node `implant_<pc>` per PC (the server keeps one `implant_<pcId>`
  foothold), for each action `grant_foothold_actions` returns, so an implant on a path the server
  does not run is not drawn. The device is a key node `device_<id>` (reused when it is also a rogue
  device). Edges: device to implant labelled `held` or `dropped`; for the session shape, the PC's
  sign-in lock to the implant labelled `session at PC`; implant to the PC's network.
- **Outage**: the network node's label gains `down while <global>`, plus `(down at start)` when
  the declared starting value is truthy by `NetworkModel.truthy?`. No gate node.
- **Port security** (not in 9.3, added because the old drawing was wrong once 4.4 shipped): a jack
  with `portSecurity: true` says so in its label and has no edge to its network, since it gives no
  foothold.

## Tests

`test/js/dungeon-graph-networks.test.mjs` gained 12 tests: link (and a link to an undefined
network drawing nothing), pivot (one and two links away, none without links), Wi-Fi (key from the
card, open network, AP on a network without a wifi block), implant (both shapes, and one under
`flagRewards` not drawn), outage (down at start and not), port security, and a clean fixture with
every field that also checks for duplicate edges. 17 of 17 pass.

## Every existing scenario

Graphs were generated for all 176 `scenario.json.erb` files before and after the change and the
`.json`, `.md` and `.html` outputs compared byte for byte: only `scenarios/test_access_networks`
changed (the only scenario using the new fields). Its committed graph was already stale before
this change and is regenerated here. The 63 untracked graph files the sweep created elsewhere were
removed.

## Live check

Rendered the puzzle tab of `scenarios/test_access_networks/dungeon_graph.html` in headless
Chromium and looked at it: 42 nodes, no two node boxes overlap, the new nodes and labels read
clearly. The four pivot labels into the server network sit close together but stay legible.

## Not done

- The HTML legend and the Markdown edge note do not mention the two-way `<-->` link edge.
  Adding a line there would rewrite every scenario's graph, so it is left for a pass that
  regenerates them all anyway.
