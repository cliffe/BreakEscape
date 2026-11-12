# Access model slice 9.3b: build log

Plan: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md`. Build order K, O, W, P, I (plan
section 3). Sub-slices land on their own branches; this log has one section each.

## Sub-slice W: Wi-Fi (branch `build/9-3b-w`, from `main` 1ba8c5cd7)

Built on 9.3a only (K and O were not yet on this branch). A Wi-Fi foothold reaches its own
network only, which 9.3a's single-network reach already handles, so W needs no `reach_conditions`,
`player_reach` or the view's `networks` block (those are K/O). Nothing K or O owns was touched; the
only shared method W changed is `link_item_for`, which W owns (plan 5.3), extended with a `wifi`
branch that leaves the `jack` branch unchanged.

### What it adds

- **Model** (`lib/break_escape/network_model.rb`): `wifi_of(data, network_id)` ({ ssid, psk } or
  nil) and `wifi_aps(data)` (room objects with `wifiAp: true` on a network that defines a wifi
  block).
- **Server** (`app/models/break_escape/network_access.rb`): `find_wifi_ap`, `wifi_foothold_id`,
  `join_network!(ap_id, key)` and `record_gained_ap!`; `link_item_for` branches on `foothold['via']`
  into `wifi_link_item_for`, which reads the `name`/`sprite` stored on the foothold at join so the
  handle survives a reload. Foothold id `wifi_<networkId>`, `via: "wifi"`, source the access point
  id. Permanent for this slice (no unplug, plan open question 7).
- **Route** (`config/routes.rb`, `games_controller.rb`, `game_policy.rb`): `POST /network/join`
  (locked, `network_join?` -> `show?`). 404 unknown AP, 403 unreachable, already -> `already: true`
  with the AP recorded, 422 `wrong_key` (not counted), else the foothold and link item. An open
  network (no psk) skips the key check.
- **Validator/schema** (`scripts/validate_network.rb`, `scenario-schema.json`,
  `validate_scenario.rb`): un-reserves `wifi` and `wifiAp` (leaves `downIf`, `portSecurity`,
  `portSecurityMessage`, `networkLinks`, `grant_foothold` refused for O/P/I). Errors: a wifi block
  with no ssid or a non-string psk; `wifiAp` without a network, on a network with no wifi block, on
  a sign-in object, a jack, or a lock. Warnings: a psk shorter than eight characters, and a psk
  that appears nowhere the player can read (via `NpcHabits::Clues.readable_texts`; `check_network_model`
  gained an optional `scenario_dir` so the readable list sees ink too).
- **Client** (`api-client.js`, `interactions.js`, `network-links.js`,
  `minigames/password/password-minigame.js`): `ApiClient.networkJoin`; an `interactions.js` wifiAp
  branch beside the jack branch; `networkLinks.interactWifiAp` (a keyless probe first, so an open
  network joins with no prompt; on `wrong_key` it opens the join minigame), `networkLinks.join`
  (emits `network_joined` for every AP, including a second one on a joined network), and the
  password minigame's new `join` mode (key field, no attempt counter, submit through
  `networkLinks.join`, "That key was not accepted" on a wrong key).
- **Tooling** (`access_leak_scanner.rb`, `verify-run.rb`): a `wifi_secret` rule flags a Wi-Fi SSID
  or key in any response (no route exemption; a key the scenario shows the player in readable room
  text is not treated as hidden). The scanner exempts a held `network_link` item's own fields, since
  its label names the network the player has joined (plan 5.3). `verify-run` prints a Wi-Fi
  foothold's name rather than a device.
- **Feature scenario** (`scenarios/test_access_networks/`): a `guest_wifi` network (SSID
  Harbour-Guest), two access points, an open share on it, a reception card with the SSID and key,
  and tasks `n8_wifi_join` / `n9_second_ap` on `network_joined`. PLAYTEST.md gains a W section.

### Tests (all green)

- Ruby unit: `test/unit/network_model_test.rb` (wifi_of, wifi_aps), `test/unit/access_leak_scanner_test.rb`
  (wifi_secret, readable-key exemption, held-link exemption).
- Rails: `test/controllers/break_escape/network_wifi_test.rb` (9 tests: join, wrong key not counted,
  open network, second AP `already`, link item, reload, 404s, no key/SSID leak).
- Node: `test/js/validator-network-model.test.mjs` (un-reserve + W error/warning fixtures, clean
  Wi-Fi fixture), `test/js/network-links.test.mjs` (interactWifiAp, probe, wrong key, second AP,
  reload), `test/js/password-join-mode.test.mjs` (the join minigame mode).
- Phone reopen check: ran; the only 4 problems are pre-existing m09 phone ink (unrelated to W).

### Live browser proof (port 3024, keyless server, games 1255 then 1256)

Drove the real client path (`interactWifiAp` -> keyless probe -> real join minigame -> server
route). On game 1256 (final scenario): a wrong key is refused with "That key was not accepted", the
field clears and no foothold is written; the right key joins (`wifi_guest_wifi`, link item in the
tray); the view lists `guest_notice` only (its own network), not an office host; the guest share
opens and the office share `scanned_inbox` is 404 (segmentation holds). The second access point
answers `already`, both AP ids land in `gainedFootholds`, one foothold remains; `n8_wifi_join` and
`n9_second_ap` are `completed` server-side. After a reload (`location.href ... ?skip_resume=1`) the
foothold, the tray handle and both AP ids come back. Tampered checks: a forged join on a non-AP
object and on a made-up AP both 404; viewing a never-joined network (`wifi_workshop_lan`) 404. The
leak scanner over the captured responses: `VERDICT: no leaks found`.

### Not done / for later sub-slices

- Dungeon graph (`scripts/generate_dungeon_graph.rb`): the plan (9.3) wants a Wi-Fi AP node and a
  `dungeon-graph-networks.test.mjs` fixture. Not implemented here (out of the brief's W deliverable
  list; low risk, additive). Follow-up for whoever lands the graph changes across K/O/W/P/I.
- K, O, P, I: separate sub-slices/branches.

### Suites

Full `bin/rails test` (1583 runs, 0 failures, 1 skip) and `bin/test-js` both green at the end.

## Round 1 code review fixes (sub-slice W)

Server review (R1): approve with follow-ups, no blocker/major. Client review (R1): one major (M1),
one minor (m1), one nit (n1). All addressed.

- **M1 (client, major): APs and key card unreachable.** `guest_ap`, `guest_ap2` and `wifi_note`
  sat at x=11, two tiles past `room_reception`'s east wall (column 9). Moved onto interior tiles
  against the east wall, each with an open floor neighbour and clear of the door-approach rows
  (y=2, y=7): `guest_ap` -> (8,5), `guest_ap2` -> (8,8), `wifi_note` -> (6,3) by the reception desk.
- **m1 (client, minor): double-click stacking a second key minigame.** `interactWifiAp` now refuses
  when a minigame is already open (`MinigameFramework.currentMinigame` present and not ending), so a
  rapid second click on an access point cannot stack a second key prompt. Test added to
  `network-links.test.mjs`.
- **n1 (client, nit): join-header escaping untested.** `password-join-mode.test.mjs` now loads the
  real `display-dashes.js` (not an identity stub) and asserts that an AP name containing `<`, `>`,
  `&`, `"` renders escaped in the join header with no element injected.
- **Server minor: `netlink_` scanner exemption untested.** Added a test to
  `access_leak_scanner_test.rb`: a network name on a `netlink_` held handle in an `/inventory`
  response raises no finding, and the same name under another holder in the same response is still
  reported.
- **Server nit: whitespace-only psk disagreement.** `validate_network.rb` now errors on a psk that
  is only whitespace (the server treats a blank psk as open, so a whitespace key would never be
  asked for); the short/unreadable warnings skip it. Test in `validator-network-model.test.mjs`.
- **Server nit: N9 could fire with N8 on a first join via the second AP.** The `network_joined`
  event now carries `already` (from the server's `body.already`), and the N9 mapping is gated on
  `data.already === true`, so joining through `guest_ap2` first no longer completes "join again
  through the second access point" on a first join. The validator's static indices-11/12 warning
  remains (same class as the accepted indices-7/10 warning); the conditions are disjoint in practice
  because N8 is onceOnly and `already` is false on any first join.
- **Server question: confirm a join requires reach.** Added a line to plan 5.3: a join is
  click-to-interact, so the player must walk to a reachable access point; "no range" means no signal
  model, not that a locked-away AP can be joined from anywhere.

### Live browser proof R1 (port 3024, keyless server, game 1258)

Redid the M1 proof through the **normal interaction path** (`window.__test.interact(id)`, which
walks the player to the object and issues a real canvas pointer click), with **no** direct
`interactWifiAp` call. In the lobby: the three W objects report interior positions (`guest_ap`
256,160 = tile 8,5; `guest_ap2` 256,256 = 8,8; `wifi_note` 192,96 = 6,3). Walking to `guest_ap` and
clicking opened the key minigame (title "Guest access point"); a wrong key left it open with no
foothold; the right key joined (`wifi_guest_wifi`, link item `netlink_wifi_guest_wifi` in the tray)
and `n8_wifi_join` completed. Walking to `guest_ap2` and clicking produced **no** second minigame
(`already` path) and completed `n9_second_ap`; exactly one Wi-Fi foothold remained. Screenshot:
`scratchpad/wifi_proof_3024.png` (the two access-point racks stand inside the east wall and the
player reaches them). Validator on the scenario: 0 errors.
