# Access model slice 9.3b: build log

Plan: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md`. Build order K, O, W, P, I (plan
section 3). Sub-slices land on their own branches; this log has one section each.

## Sub-slice I: implants (branch `build/9-3b-i`, from `main` ecc009d10)

Built on top of 9.3a only (K and O's reach model is not on this branch). An implant grants a
foothold on the target PC's own network through 9.3a's single-network reach, which is exactly
"the PC's own network and nothing else" with no links present. Reused `AccessWork#plant_refused?`
(9.2 U, on main) for the USB hook. `reach_conditions` was not touched (K/O own it).

### What was built

- **Model** (`lib/break_escape/network_model.rb`): `NetworkModel.grant_foothold_actions(data)`, a
  walk that keeps a `grant_foothold` only where `DeclaredGrants.executed?` says the path is
  server-run (the same test the validator uses), returning `{ pc, shape, needs_dropped, needs_held,
  name, path }`. `reach_conditions` left unchanged.
- **Server** (`app/models/break_escape/network_access.rb`): `implant_foothold!(pc_id, shape, path)`
  with the preconditions of 5.5 (action exists by path; already-held before the preconditions; the
  dropped shape reads `droppedItems`; the session shape needs a non-foothold session and the held
  `needsHeld`, which it removes; the USB hook via `plant_refused?`). `link_item_for` branches on
  `via == 'implant'` into `implant_link_item`, reading the `name`/`sprite` stored on the foothold
  record so a reload and the tray are right. New helpers: `implant_foothold_id_for`, `dropped_items`,
  `grant_foothold_action_for`, `inventory_item_matching`, `implant_sprite`.
- **Route and policy**: `POST network/implant` (`config/routes.rb`), `network_implant` controller
  action (locked, in the before_action and `with_game_lock` lists), `network_implant?` policy.
- **Validator** (`scripts/validate_network.rb`): dropped the `grant_foothold` reservation; added the
  path-aware checks (not server-run, neither/both shape, pc not a sign-in host on a network, missing
  or unknown `needsHeld`, the action on the sign-in PC it targets, `consumesItem` on its host, two of
  the same pc and shape) and the USB-policy warning, all reusing `DeclaredGrants.executed?`.
- **Schema** (`scripts/scenario-schema.json`): `grant_foothold` added to the triggerOnInteract action
  `type` enum, with `pc`/`needsDropped`/`needsSession`/`needsHeld`/`name` property docs. Not added to
  the `flagReward` enum (the validator refuses it there).
- **Client**: `ApiClient.networkImplant` (`api-client.js`); the `grant_foothold` case in
  `systems/apply-actions.js` delegating to `networkLinks.implant`; `NetworkLinks.implant(pcId, shape,
  path)` in `systems/network-links.js` (one retry on a network error, syncs the inventory, adds the
  foothold, emits `network_foothold_gained`/`network_device_refused`, opens the view on the first).

### Tests

- Unit: `test/unit/network_model_test.rb` (`grant_foothold_actions` keeps server-run paths, reads the
  shape and needs).
- Rails: `test/controllers/break_escape/network_implants_test.rb` (12 tests: the enumerator; the
  dropped shape; the session shape and its consume; the non-foothold-session rule; the USB refusal;
  the already-held idempotence; reach to the PC's own network only; forged/bad-shape/never-granted
  tampered checks). 12 runs, 46 assertions, 0 failures.
- Validator fixtures: `test/js/validator-network-model.test.mjs` (a clean implant scenario raising no
  error, one fixture per new error, and the USB warning). 38 of 38 pass.
- Client: `test/js/network-links.test.mjs` (4 implant tests: grant and emit, already, usb_refused
  toast, not_ready quiet). 38 of 38 pass.

### Feature scenario and browser proof

`scenarios/test_access_networks` gained beats N11 (dropped), N12 (BadUSB), N13 (USB refusal), with a
`kit_badusb` and a droppable `kit_stick` in the lobby, props `sam_dock`/`kiosk_dock`/`door_dock`, and
a `kiosk_locked` USB-blocking policy. `PLAYTEST.md` documents them; the expected validator output
notes the one deliberate USB warning (N13). Validator: 0 errors.

Browser proof on :3026 through the real `window.__test` bridge (game 1262, :3026, headless, 17/17 checks): picked up both
USB items; signed in at the kiosk and used `kiosk_dock` (N13: refused, no foothold, device kept);
signed in at `sam_pc` and used `sam_dock` (N12: `implant_sam_pc` on `office_lan`, device consumed);
dropped `kit_stick` and used `door_dock` (N11: `implant_door_box` on `office_lan`, no session); the
implant view listed only office hosts/shares; tampered requests (a forged session implant, a non
sign-in target, a never-granted foothold view) all refused; a reload with `?skip_resume=1` kept both
implant footholds with their `via` and network.

Leak scanner (`access-leak-check.rb` over the 39 captured responses): VERDICT no leaks found. The network name appears only in the `$.footholds[*].network.name` of `GET /scenario` for held footholds, which section 7 allows and the scanner exempts.

### Suites

Under the shared lock: `bin/rails test` 1619 runs, 23653 assertions, 0 failures, 0 errors, 1 skip. `bin/test-js -j 3` 493 files passed, 0 failed. Phone reopen check: the 4 problems are all m09 phone ink files, unrelated to this change (no ink/phone code touched).

### Open / not done

- The dungeon graph's implant node (plan 9.3, stream T) is not added here; the generator does not
  error on `grant_foothold` and no shipping scenario uses it. The scenario's `dungeon_graph.*` were
  regenerated to match the new objects.
- No-exposure controller test (`network_no_exposure_test.rb`) was not extended with an implant case;
  the implant's "a foothold and nothing else" and the no-leak of preconditions are covered by
  `network_implants_test.rb` and the live leak scan. Worth adding when K/O land.

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
