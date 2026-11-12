# Access model slice 9.3b: build log

Plan: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md`. Build order K, O, W, P, I (plan
section 3). Sub-slices land on their own branches; this log has one section each. Keep sections
self-contained.

## Sub-slice K: Links and the pivot (branch `build/9-3b-k`, from `main` 708b154e8)

Built on 9.3a and W (W was already on `main`). K adds links between in-game networks and the
pivot through a held session. Section 13 answers taken as recommended: an outage keeps sessions;
the eight-path cap on `reach_paths` with a validator warning above it; signing out of a pivot ends
the onward sessions. The segmentation rule holds: a bare foothold reaches its own network only; a
linked network is reached only by pivoting through a session.

### What it adds

- **Model** (`lib/break_escape/network_model.rb`): `network_links` (normalises `networkLinks` to
  pairs of defined networks), `linked_networks` (undirected), `all_reach_paths`/`reach_paths` (every
  simple path, shortest first, stable order, capped at eight with a ceiling of 64), and
  `reach_conditions` extended to walk `reach_paths` and carry each path's network `downIf` globals
  (all nil in K, so routes stay empty; the shape is ready for O). `network_up?` is introduced
  returning true (O makes it read `downIf`).
- **Server** (`app/models/break_escape/network_access.rb`): `structural_reach` and `player_reach`
  (seeded from the foothold's own network, expanded only through a session at a member host),
  `networks_reachable_from` (the pivot walk from a signed-in host), `prune_unreachable_sessions!`
  (ends sessions carrying a foothold whose PC network is in no held foothold's `structural_reach`;
  leaves blank-foothold local sessions), and the view's `networks` block (an up entry per reached
  network with its `via` host, a greyed down entry per network a session is held on but not reached).
  `host_reachable_through?`, `resource_admits_player?` and `mapped_shares` now resolve reach through
  `player_reach`/`networks_reachable_from` instead of single-network equality.
- **Hooks** (`game.rb`, `games_controller.rb`): `logout_session!` and `end_claimed_sessions!` run
  `prune_unreachable_sessions!`; `POST /logout` answers `endedPcIds`.
- **Validator/schema** (`scripts/validate_network.rb`, `scenario-schema.json`): un-reserves
  `networkLinks` (leaves `downIf`, `portSecurity`, `grant_foothold` for O/P/I), with errors for a
  malformed entry, an undefined or self-linked network; warnings for a network reachable only by a
  pivot with no host to open it, and for more than eight link paths between two carrying networks;
  an information line listing each network's link reach and its pivot hosts. Schema: `networkLinks`
  real definition.
- **Client** (`minigames/network-view/network-view-minigame.js`, `systems/pc-sessions.js`): the view
  renders the further-network blocks under the own-network rows (up blocks with live controls, down
  blocks greyed with "No route to <host>"), wires their row actions through the same foothold, and
  emits `network_viewed:<networkId>` per up block. `signOut` reads the logout answer's `endedPcIds`
  and closes the onward desktops (`linkDropped`). The scoped-request route test (5.2) is O's; no
  client change here threads a foothold.
- **Feature scenario** (`scenarios/test_access_networks/`): a `server_net` linked to `office_lan`,
  a server host `sv_fs02` (it only) in a new server room, a protected `backup_vault` share, a sign,
  and tasks `n2_pivot` / `n3_signin_across` / `n4_signout`.

### Tests (all green)

- Ruby unit (`test/unit/network_model_test.rb`): `network_links`, `linked_networks`, `reach_paths`
  (chain, cycle, same-network single node, the eight cap), `reach_conditions` over a link.
- Rails (`test/controllers/break_escape/network_pivot_test.rb`, 7 tests): N1 segmentation and the
  refused sign-in, N2 the pivot block with its `via`, N3 the sign-in across the link and the mapped
  protected share, N4 logout pruning the onward session, and `prune_unreachable_sessions!` both ways
  (a foothold session on an unreachable network ended, a local claim kept; the pivot surviving a
  settled keyboard session). `network_no_exposure_test.rb` gains the bare-foothold case (N1).
- Node (`test/js/validator-network-model.test.mjs`): the un-reserve, a clean linked scenario with
  its link-reach line, the malformed/undefined/self-link errors, the pivot-no-host warning and the
  >8-paths warning. `test/js/network-view.test.mjs`: the up block (actionable, its own
  `network_viewed`) and the greyed down block.

### Live browser proof (port 3027, keyless server, game 1270)

Drove the real client transport (`window.ApiClient` -> the real routes) and the real view UI. N1: a
bare office foothold's view lists `office_lan` only; a sign-in to `sv_fs02` across the link is 403
without a pivot; a forged foothold id is 404. N2: after a remote sign-in at Lena's office PC the view
gains a `server_net` up block, through `lena_pc`. N3: `sv_fs02` signs in across the link through the
same foothold and its protected `backup_vault` share is served. N4: signing out of `lena_pc` returns
`endedPcIds` including `sv_fs02` and the server block disappears. After a reload (`location.href` with
`?skip_resume=1`) the foothold persists, the pivot password session survives and the server desktop
opens with no password; the UI view renders the `server_net` block. The leak scanner over the 19
captured responses: `VERDICT: no leaks found`. Lab live check (game 1271): `lab_physical_pentest`
plants and views as before, `office_lan` only (K inert, no links), `kp_dropbox_viewed` still fires.

### Not done / for later sub-slices

- Dungeon graph (`scripts/generate_dungeon_graph.rb`): the plan (9.3) wants a link edge and a pivot
  edge plus `dungeon-graph-networks.test.mjs` fixtures. Deferred (as W deferred the Wi-Fi node), for
  whoever lands the graph changes across the sub-slices. Low risk, additive.
- O, P, I: separate sub-slices (P is already on `main`).

### Suites (after merging `main` fea96124c with 9.3b P and 9.2 C, under the shared lock)

- `bin/rails test`: 1707 runs, 25041 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3`: 498 files passed, 0 failed.
- Merge of `main` into `build/9-3b-k`: two conflicts resolved (both sides' tasks/mappings in
  `test_access_networks` kept; both `with_pivot` (K) and `with_secured_port` (P) support helpers kept).

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

### R1 suites (after merging main, both under the shared lock)

- `bin/rails test`: 1645 runs, 24287 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3`: 495 files passed, 0 failed.

Merged `main` into `build/9-3b-w` (kept both sides; one conflict in
`test/unit/access_leak_scanner_test.rb` where main's slice 9.2 H block met the W netlink test,
resolved by keeping both).

## Round 2 code review fixes (sub-slice W)

Review R2 (docs/achitechture/ACCESS_MODEL_SLICE_9_3B_W_CODE_REVIEW_R2.md): approve, no
blocker/major; one minor (title sink) and one nit (`already` payload untested). Both addressed.

- **Minor: author access-point name reached the unescaped `params.title` HTML sink.**
  `_promptWifiKey` (`network-links.js`) passed the author AP name as the base minigame `title`,
  which `base-minigame.js` renders as HTML before the password join branch overrides the header
  with its own escaped version. `_promptWifiKey` now passes a constant `title: 'Join Wi-Fi'`; the
  join branch still receives the real name in `join.apName` and escapes it for the visible header,
  so no author text reaches the base template. Added a `network-links.test.mjs` test asserting that
  an AP name containing HTML never reaches `params.title` (title stays the constant, `join.apName`
  still carries the real name).
- **Nit: N9 `already` payload field untested.** The second-AP test in `network-links.test.mjs` now
  asserts the first `network_joined` carries a falsey `already` and the second-AP already-join
  carries `already === true`, so a regression dropping the field or flipping the N9 gate fails a test.
- The shared sink itself (`base-minigame.js` renders `params.title` as HTML for every minigame) is
  pre-existing and out of W's scope; logged in `docs/IDEAS_BACKLOG.md` as a central follow-up
  (escape `params.title` after checking no caller relies on HTML in a title).

### R2 suites (both under the shared lock, after the main merge)

- `bin/rails test`: 1645 runs, 24287 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3`: 495 files passed, 0 failed.
- `node --test test/js/network-links.test.mjs` (changed file, alone): 42 pass, 0 fail.
- Merge of `main` into `build/9-3b-w`: already up to date (the branch already contained all of
  main), no new conflicts.

## Sub-slice P: port security (branch `build/9-3b-p`)

Un-reserves `portSecurity` and `portSecurityMessage` on a jack and makes a secured jack refuse an
unknown device. Refuse-only, no bypass (section 13, decided as recommended). The decisions of
section 13 that bear on P: refuse-only port security, no bypass.

### What it does

A `networkJack` with `portSecurity: true` takes the device in, gives no foothold, keeps the device
in the inventory, and shows a message (the authored `portSecurityMessage`, or a default naming the
fix: disable unused ports). The refusal names nothing about the network behind the port.

### Files changed (this sub-slice)

- `app/models/break_escape/network_access.rb`: `PORT_SECURITY_REFUSAL` default constant; a small
  `port_security_refusal(jack_object)` helper; one guard in `plant_device!`, after "object
  reachable" and before the device is taken, that answers `422 { success: false, reason:
  'port_security', error: <message> }` (section 5.4).
- `scripts/validate_network.rb`: drop `portSecurity`/`portSecurityMessage` from
  `NETWORK_RESERVED_OBJECT_FIELDS` (leaving `wifiAp` reserved for sub-slice W); a port-security
  check block: error on `portSecurity` on a non-jack, `portSecurityMessage` without `portSecurity`,
  and a jack that is both `portSecurity` and `wifiAp` (4.4).
- `scripts/scenario-schema.json`: rewrite the two reserved stubs into real definitions
  (`portSecurity` boolean, `portSecurityMessage` string).
- `public/break_escape/js/systems/network-links.js`: a `422 port_security` branch in `plant()`
  that shows `body.error` and emits `network_device_refused { jackId, reason: 'port_security' }`.
- `test/support/network_model_scenario.rb`: `with_secured_port` helper and `PORT_SECURITY_MESSAGE`.
- `test/controllers/break_escape/network_footholds_test.rb`: three Rails tests (refusal with the
  authored message and the device kept; the default message; an open jack still plants).
- `test/js/validator-network-model.test.mjs`: portSecurity on a jack accepted; the three new
  validator errors; the reserved test trimmed to the fields still reserved.
- `test/js/network-links.test.mjs`: the client port-security refusal test.
- `scenarios/test_access_networks/`: the N10 beat (`secure_port` jack, `sign_n10`, the
  `n10_port_security` task, the `network_device_refused` event mapping) in `scenario.json.erb`,
  with its section in `PLAYTEST.md`.

### Shared files, edits kept small

`network_access.rb` (own method + one guard), `validate_network.rb` (own check block, un-reserve
only P's fields), `scenario-schema.json` (two field defs). No change to `reach_conditions`,
`network_model.rb`, `game.rb`, `games_controller.rb`, `routes.rb` or the leak scanner: port
security sits entirely on the existing plant path.

### Tests

- `test/js/validator-network-model.test.mjs`: 34 pass.
- `test/js/network-links.test.mjs`: 35 pass.
- `bin/rails test test/controllers/break_escape/network_footholds_test.rb`: 31 runs, 337
  assertions, 0 failures.
- Validator `scenarios/test_access_networks/scenario.json.erb --no-graph`: exit 0, no errors.

### Browser proof

Keyless server on :3025 (GEMINI warning confirmed), game 1257, `test_access_networks`, headless
Chromium, driven through the real player path (`window.__test.interact`, the plant confirm clicked
by its "Plug it in" button), not test helpers.

- **Secured port refuses (real path):** take the drop box, enter the comms room, interact
  `secure_port`, confirm. The authored message toast shows, no view opens, no link item arrives,
  the box stays in the inventory, and task `n10_port_security` completes. Client `footholds()` is
  empty.
- **Allowed device works:** interact `comms_port`, confirm. A `jack_comms_port` foothold is gained
  and the box becomes the link item.
- **Tampered-client checks (against the real server):** a direct `ApiClient.networkPlant("secure_port")`
  answers `422 { reason: "port_security", error: <message> }` even with no device in hand (the
  server refuses before taking a device); `GET /network?foothold=jack_secure_port` answers
  `404 Foothold not found` (no foothold was ever forged for the secured port).
- **Reload (`location.href` to the game URL with `?skip_resume=1`):** after the reload the
  `jack_comms_port` foothold persists, there is no `jack_secure_port` foothold, the link item is in
  the inventory, and `n10_port_security` stays complete.
- **Server record (Rails):** `footholds` = `["jack_comms_port"]`, `gainedFootholds` = `["comms_port"]`,
  no `jack_secure_port`.
- **Leak scan** over 26 captured responses: `VERDICT: no leaks found.` (the port-security refusal
  carries only the authored message).

### Review R1 (`ACCESS_MODEL_SLICE_9_3B_P_CODE_REVIEW_R1.md`)

Verdict: approve, no blocker or major. The two minors and the two nits are fixed in this slice;
each fix has a test that fails without it (the nits are pinning tests).

- **Minor 1 (fixed):** the `toast()` wrapper in `network-links.js` now passes `{ plainText: true }`
  to `gameAlert`, so author and server text (port-security refusals, jack hints, network names) is
  shown as plain text, not interpolated into `innerHTML`. This also fixes the pre-existing
  `no_device` hint toast. Every toast in the file goes through this one wrapper, so no other author
  or server text reaches `innerHTML`; the confirm dialogs already passed `plainText`.
- **Minor 2 (fixed):** `validate_network.rb` now warns (not errors) when a `portSecurityMessage` is
  present but blank or whitespace-only, because the runtime quietly falls back to the default line.
- **Nit 1 (fixed):** the Rails port-security test now asserts the 422 body is exactly
  `%w[error reason success]` (the leak guarantee of spec 5.4).
- **Nit 2 (fixed):** a client test now exercises the `b.error` fallback (a `422 port_security` with
  no `error`) and asserts the generic line is shown.

Tests after R1:
- `test/js/network-links.test.mjs`: 38 pass (was 35; +3 for minor 1 and nit 2).
- `test/js/validator-network-model.test.mjs`: 35 pass (was 34; +1 for minor 2).
- `bin/rails test test/controllers/break_escape/network_footholds_test.rb`: 31 runs, 338
  assertions (was 337; +1 for nit 1), 0 failures.
- Validator `scenarios/test_access_networks/scenario.json.erb --no-graph`: exit 0, no errors.

### Merge of main (sub-slice W) into build/9-3b-p

Merged `main` (which carries sub-slice W, in-game Wi-Fi) into `build/9-3b-p` and resolved the
conflicts by hand. Conflicts and resolutions:

- `scripts/validate_network.rb`: `NETWORK_RESERVED_OBJECT_FIELDS` now empty (both W's `wifiAp` and
  P's `portSecurity`/`portSecurityMessage` are un-reserved); `NETWORK_RESERVED_NETWORK_FIELDS` keeps
  `downIf` (sub-slice O). The `grant_foothold` action stays reserved for the implant work. P's
  port-security check block (with the `portSecurity`/`wifiAp` cross-check) and W's wifiAp block both
  kept.
- `scripts/scenario-schema.json`: kept W's real `wifiAp` definition and P's real `portSecurity`/
  `portSecurityMessage` definitions.
- `test/js/validator-network-model.test.mjs`: the shared "still reserved" test now asserts only
  `networkLinks`, `downIf` and `grant_foothold`; kept both P's port-security tests and W's Wi-Fi
  tests. Added a test for the `portSecurity`/`wifiAp` cross-check on its own, now that `wifiAp` is a
  real field (it asserts the cross-check error fires and neither field is refused as reserved).
- `test/js/network-links.test.mjs`: kept P's `toastCalls` capture and W's `joinAnswer` mock and
  Wi-Fi fixtures.
- `scenarios/test_access_networks/scenario.json.erb` and `PLAYTEST.md`: kept W's N8/N9 and P's N10,
  no duplicate ids; every N10 object (`secure_port` 8,6; `sign_n10` 6,6) sits on a reachable comms
  room tile, clear of the P1-P12 signs and W's lobby objects.
- This build log: kept both the W and P sections.

### Live check after the merge (port 3025, keyless server, game 1264)

Walked N8 to N10 by hand on the merged scenario through the real client path (`window.__test`
interact, the plant confirm clicked by its "Plug it in" button; the Wi-Fi join driven through the
join minigame), not test helpers.

- **N8 Wi-Fi join:** interact `guest_ap`, join minigame titled "Join Wi-Fi" (the W R2 constant). A
  wrong key is refused (`POST /network/join` 422), no foothold; the right key (`seabreeze-2025`,
  read from the reception card) joins: `network_joined { apId: 'guest_ap', already: false }`,
  foothold `wifi_guest_wifi`, the view opens, `n8_wifi_join` completes.
- **N9 second access point:** joining again through `guest_ap2` on the same network answers
  `already`, emits `network_joined { apId: 'guest_ap2', already: true }` with no second minigame,
  and completes `n9_second_ap`; both AP ids are in `gained`, one Wi-Fi foothold.
- **N10 secured port refuses:** take the drop box, enter the comms room, interact `secure_port`,
  confirm. The authored switch message shows as a toast, `network_device_refused { jackId:
  'secure_port', reason: 'port_security' }` fires, `n10_port_security` completes, the drop box
  stays in the inventory and `secure_port` has no foothold.
- **Open port still plants:** interact `comms_port` (open) and confirm: `jack_comms_port` foothold
  gained, the box becomes the "Drop box: comms room" link item.
- **Reload (`?skip_resume=1`):** the `wifi_guest_wifi` and `jack_comms_port` footholds, both link
  items and the three completed tasks all come back; no `secure_port` foothold.

### Suites after the merge (both under the shared lock)

- `bin/rails test`: 1648 runs, 24304 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3`: 495 files passed, 0 failed.
- Validator `scenarios/test_access_networks/scenario.json.erb --no-graph`: no error lines (two
  info lines for the `secure_port` reach and the `guest_wifi` NPC-only network).

### Handover

Sub-slice P complete and merged with sub-slice W. Nothing in progress. The
`portSecurity`/`wifiAp` combined validator error now has its own test (wifiAp is a real field after
W), alongside the pre-existing combined case.
