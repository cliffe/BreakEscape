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

### Round 1 code review fixes (commit 4c91bf807; review `ACCESS_MODEL_SLICE_9_3B_K_CODE_REVIEW_R1.md`)

0 blockers, 0 majors, 3 minors, 2 nits. Fixed m1, m2, m3 and n1; rejected n2.

- **m1 (via tie-break).** `view_session_hosts` carries each session's `seq` (its insertion
  position, kept across prunes and keyboard settles, so it is the session's creation order);
  `via_for` tie-breaks `[seq, host_id]`, so the bridging host is the earliest pivot session then the
  lowest host id (plan 5.1). Sessions have no stored `seq` and adding one would break many exact-hash
  session assertions, so the insertion-order proxy is used rather than a new state field.
- **m2 (via displayName).** `via_for` adds `displayName`, the bridging session's account display name,
  guarding a missing npc.
- **m3 (open share on a linked network needs a pivot) — the decision.** Plan 5.1 routes an **open**
  share through the foothold branch ("reached by any held foothold that reaches its network") and
  the session branch only "for a share with an access list"; 9.3a already made open shares
  foothold-reached and access-listed shares session-reached. The code's session branch (and
  `mapped_shares`) resolved reach with the pure link graph gated only by the ACL, so an open share
  (ACL admits everyone) was reachable across a link from a bare session on a link-adjacent network,
  with no pivot. Decided to require a pivot, per the plan's text and the slice rule (a linked network
  is reachable only by pivoting through a held session). Fix: in the session branch and
  `mapped_shares`, an open share is reached from a session only on **its own network**; an
  access-listed share still maps across the pivot walk, gated by its list (the member-of-staff
  model). A linked open share now needs a foothold whose `player_reach` includes it, which only a
  held pivot session opens. The 9.3a same-network open-share-via-local-desktop path is preserved
  (that session is on the share's own network). Two `network_pivot_test.rb` tests added: a bare
  office session neither opens nor maps a linked open share while a same-network session does, and a
  foothold pivoting through a held office session does reach it.
- **n1 (dense-path warning).** The `>8 paths` validator warning says "at least 64" when the count
  hits `REACH_PATHS_CEILING`, so a dense graph is not reported as exact.
- **n2 (memoise `all_reach_paths`) rejected.** Performance-only, bounded by the 64 ceiling, no
  correctness issue at K's scale; the reviewer agreed no change is needed.

Main moved on past the first merge (TTS R3 minors work), so `main` (`1f5a0f7fb`) was merged again
into `build/9-3b-k`; the merge was clean (no conflicts), keeping both sides.

### R1 suites (after the second main merge, both under the shared lock)

- `bin/rails test`: 1719 runs, 25105 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3`: 498 files passed, 0 failed.
- Validator on `scenarios/test_access_networks/scenario.json.erb --no-graph`: 0 `❌` lines.

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
- (Done in R1, server minor 2) `network_no_exposure_test.rb` carries a `POST /network/implant`
  not_ready case under `refute_exposed`, so the implant's "a foothold and nothing else" is asserted
  there as well as in `network_implants_test.rb` and the live leak scan.

### Review R1 outcomes (server `..._R1_SERVER.md`, client `..._R1_CLIENT.md`)

Both reviews: no blockers, one client Major. Fixes applied:

- **Client M1 (tray reconcile)** `network-links.js` `implant()` no longer passes the whole tray to
  `syncInventoryFromServer`, which could remove a tray item whose own pickup persist was still in
  flight. `implant_foothold!` now returns `consumedId` (the one device the session shape removes;
  the dropped shape consumes nothing), and the client reconciles only `[foothold.itemId,
  consumedId]`, as 9.3a's `plant()` does. New JS test: an unrelated, not-yet-synced tray item is
  kept; plus server assertions that `consumedId` names the device (session) or is nil (dropped).
- **Client m1 (plain-text toasts)** adopted P's `toast()` wrapper passing `{ plainText: true }`, so
  server/author strings (USB refusal, network names) render as text; matches main for a clean merge.
- **Client m2 (test gaps)** added JS tests: the dropped shape (N11), a one-retry-then-success path
  (mock call counter), the M1 kept-item case, and a new `grant-foothold-action.test.mjs` for
  apply-actions `grant_foothold` (shape mapping, `pc`/`path` forwarding, no-networkLinks warning).
- **Client n1** `_publishPlanted` now runs before the `already` return, as `plant()` does (asserted).
- **Client n2** a foothold lost after both retries shows a plain-text toast rather than failing
  silently (asserted).
- **Server minor 1** one grant_foothold per `[pc, shape]` is the single rule: the validator already
  enforced it; the spec (5.5) and the `grant_foothold_action_for` comment now say so, and document
  that `path` is forwarded but not load-bearing (no two actions can reach the same pair).
- **Server minor 2** `network_no_exposure_test.rb` gains a `POST /network/implant` not_ready case
  under `refute_exposed`.
- **Server minor 3** the dropped shape stays graded weak (client-reported trigger, a bounded host
  list, every host still password-checked); this matches the plan 5.5 grading and is unchanged.
- **Server nits** the dropped branch now wraps the inventory in `Array(...)` before `<<`; a comment
  on `inventory_item_matching` notes `needsHeld` should name a device by id when types collide.

### Live check R1 (port 3026, keyless server, game 1263)

18/18 checks: N13 refused (no foothold, BadUSB kept), N12 BadUSB consumed with the foothold on
`office_lan` and an unrelated held `kit_stick` kept through the implant (M1), N11 dropped-stick
foothold with no session, the implant view listing only office hosts, three tampered requests
refused, and a `?skip_resume=1` reload keeping both implant footholds with their `via` and network.

### Merge of main (sub-slices W then P) into build/9-3b-i

Merged main twice (W at `708b154e8`, then P at `32b767faf`). Conflicts were the shared symbol
lists (controller before/around_action), the new route, the policy method, `api-client`'s new
method, `link_item_for`'s via branch, the network-links event doc, and the network test files,
scenario, PLAYTEST and this log; all additive, both sides kept. The "needs slice 9.3b" guard test
now asserts only K's `networkLinks` and O's `downIf`, since grant_foothold (I), wifiAp (W) and
portSecurity (P) have all landed. Used main/P's `toast()` wrapper and `toastCalls` mock.

### R1 suites (after both merges, both under the shared lock)

- `bin/rails test`: 1662 runs, 24397 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3`: 496 files passed, 0 failed.
- Changed JS files alone: `network-links.test.mjs` 55 pass, `validator-network-model.test.mjs`
  49 pass, new `grant-foothold-action.test.mjs` 4 pass.

### Review R2 outcomes (`..._SLICE_9_3B_I_CODE_REVIEW_R2.md`)

No blockers, one Major, two minors, two nits. Fixes applied (see the review file for detail):

- **M1 (lost-response retry)** the already-held branch of `implant_foothold!` now returns
  `consumedId` from the stored foothold record's device id, so a retry after a lost response
  reconciles the consumed device off the tray exactly as the first success would. No client change
  (it already forwards `body.consumedId`). New JS test for throw-after-server-success-then-retry and
  server tests for the repeat session (names the device) and dropped (names none) cases.
- **m1** the validator errors when a `needsHeld` device object has no `id` (it can never be
  reconciled off the tray). New JS test.
- **m2** the validator adds `onConfirm` to the host keys and carries each timer element as the host
  of its own actions, so the two session-shape guards cover a grant_foothold on a timer or onConfirm.
  New JS test.
- **n1** kept as documented (`path` is forwarded but not load-bearing).
- **n2** this log's stale "Open / not done" line corrected.

### Merge of main (9.2 C, social media) into build/9-3b-i

Merged main at `fea96124c`. One conflict, `games_controller.rb`: both sides add to the
before/around_action symbol lists (`:network_implant` here, `:feed_post` on main); kept both, as the
merge rule says. Everything else auto-merged (routes, policy, api-client, schema, the social feed
files are additive).

### Live check R2 (port 3026, keyless server, game 1277, real client)

Re-ran the implant steps through the real `window.__test` client after the fix and the merge. All
six checks pass: N13 kiosk USB refused (no foothold, BadUSB kept); N12 BadUSB at Sam's desk
(`implant_sam_pc` on `office_lan`, device consumed, link item present, no extra session); N11
dropped stick at the door controller (`implant_door_box` on `office_lan`, no session); a
`?skip_resume=1` reload keeps both implant footholds with their `via` and network; a forged implant
on a PC with no `grant_foothold` action answers 404 `no_action`; a view of a never-granted foothold
answers 404. `verify-run.rb --access` on game 1277 confirms both footholds on `office_lan` and no
kiosk foothold.

### R2 suites (after the fix and the merge, under the shared lock)

- `bin/rails test`: 1708 runs, 25044 assertions, 0 failures, 0 errors, 1 skip (the known skip).
- `bin/test-js -j 3`: 499 files passed, 0 failed.

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

## Sub-slice O: Outages (branch `build/9-3b-o`, from `main` f9a661a14)

Built on `main`, which already carries K (links/pivot), W (Wi-Fi), P (port security) and I
(implants). K had done most of the reach and view work (`network_up?`, `structural_reach`,
`player_reach`, the up/down view blocks, `prune_unreachable_sessions!`) with `network_up?` stubbed
to always true and the down-block path dormant. O makes the outage real: `network_up?` reads a
network's `downIf` global, a resource's own `downIf` is honoured, and the scoped-request route test
is added. Section 13 answer 4 is taken as recommended: an outage never deletes a session, it shows
"no route" and the session reopens when the route returns; a pivot is ended only by sign-out.
`reach_conditions` already carried each route's `downIf` globals (K built the shape), so 9.2's NPC
side sees the outage with no further change here.

### What it adds

- **Model** (`lib/break_escape/network_model.rb`): `NetworkModel.truthy?` (the globals-relevant
  falsy set, matching 9.2's `npc-work.js` and the server's `truthy_global?`): false for `false`,
  `nil`, `0`, `0.0`, `""` and a missing key; true for everything else, the string `"false"` included.
- **Server** (`app/models/break_escape/network_access.rb`): `network_up?` now reads the network's
  `downIf` global (player state, falling back to the scenario default) and applies `truthy?`;
  `resource_down?` does the same for a resource's own `downIf`; `outage_global` is the shared reader;
  `session_route_up?` is the scoped-request route test, read from the server's own
  `sessions[pc]['foothold']`, never a client parameter. A down resource is withheld from
  `network_rows`, refused by `resource_admits_player?` and skipped by `mapped_shares`. A down network
  drops out of `player_reach` already (K), so its hosts and shares leave the view and are refused.
- **Hooks** (`game.rb`): `session_admits?` (login_pc and profile scopes) and
  `scope_admitted_by_session?` now require `session_route_up?`, so a folder GET, an inventory add and
  an unlock scoped under a remote session over a down route are refused with 9.3a's invented-id /
  unreachable answers. A local (blank-foothold) session is judged exactly as 9.3a did, so no 9.3a
  scenario changes. A down host's remote sign-in is already 403 through `host_reachable_through?`
  (player_reach), so `attempt_login!` needs no new branch.
- **Validator/schema** (`scripts/validate_network.rb`, `scenario-schema.json`): un-reserves network
  `downIf`; errors on a non-string network `downIf`; warns on an undeclared network `downIf` global
  (wording matched to 9.2's resource message) and on an open share with contents on a network that
  starts down; two information lines (each network and resource `downIf` and its starting state).
  9.2 keeps the resource `downIf` validator in `validate_access_work.rb`; O does not touch it.
  Schema: network `downIf` rewritten from the reserved stub to a real definition.
- **No client change.** Network-level outages flow entirely through `network_up?` -> `player_reach`,
  which K's view already renders as an absent or greyed "no route" block; the scoped-request route
  test is read server-side from the session record, so no foothold is threaded from the client.

### Tests (all green)

- Unit (`test/unit/network_model_test.rb`): `truthy?` over each falsy and several truthy values;
  `reach_conditions` carrying each network's `downIf` on the route (station network's own outage a
  condition even for a same-network resource).
- Rails (`test/controllers/break_escape/network_outages_test.rb`, 7 tests): N5 (down by default
  absent, sign-in refused, tampered client cannot clear the global, down resource withheld), N6
  (repair fills the block in and the host signs in), N7 (held session kept, shown "no route", desktop
  refused then reopened with no password), the scoped route test both ways (refused over a down
  route, a blank-foothold local session never refused), and the resource-side outage. The 112
  existing network controller tests still pass unchanged.
- No-exposure (`network_no_exposure_test.rb`): a down-by-default network nobody has reached is absent
  from every read route, even with a pivot session on the adjacent network; its host is refused like
  an invented id.
- Validator fixtures (`test/js/validator-network-model.test.mjs`): a clean network-`downIf`
  scenario, the non-string error, the undeclared-global warning, the start-down open-share warning
  (and the up case raising none), and the outage info line; the "needs slice 9.3b" guard now asserts
  no 9.3b field is reserved any more.
- Test support (`test/support/network_model_scenario.rb`): `with_outage` (server_net carrying a
  `downIf`, down or up) and `with_resource_outage` (an open share whose own service switches off).

### Feature scenario and browser proof

`scenarios/test_access_networks`: `server_net` carries `downIf: "servers_offline"` (declared `false`,
so K's N1-N4 are unchanged); a `server_breaker` object takes the network down and arms N7, a
`server_power` object restores it, a sign explains the beats. Tasks `n5_outage`/`n6_repair`
(completed on the breaker/power interact) and `n7_held_route` (an eventMapping on `pc_desktop_opened`
for `sv_fs02` while armed and repaired). `PLAYTEST.md` gains the O section; the expected validator
output notes the one new info line and no new warning. Validator on the scenario: 0 error lines.
`lab_physical_pentest` is untouched and still validates with 0 errors (O is inert without `downIf`).

Browser proof on a keyless server on :3031 (game 1304, headless Chromium, through the real
`window.ApiClient` transport, 13/13 checks): plant and pivot; the baseline up block; N5 (down by
default absent from the view, a sign-in on the down host 403, GET /scenario names no server string);
N6 (repair fills the block in, the host signs in, the desktop opens); N7 (the held session shown as
a down "no route" block, the desktop refused 403 while down, the foothold survives, the desktop
reopens with no password on repair). `verify-run --access` on the game confirms both sessions kept
(`sv_fs02 = ian ... foothold jack_comms_port`) after the full down/up cycle. The leak scanner
(`access-leak-check.rb` over the captured responses): VERDICT no leaks found.

### Suites (under the shared lock)

- `bin/rails test`: 1758 runs, 25388 assertions, 0 failures, 0 errors, 1 skip (the known skip).
- `bin/test-js -j 3`: (see the handover for the final count).

### Not done / for later

- Dungeon graph (`scripts/generate_dungeon_graph.rb`): the plan (9.3) draws an outage as a condition
  on a network node; deferred across K/O/W/P/I as before, low risk, additive.
- The 9.2 hand-off display of a sign-in host whose own `affordance.offWhen` is truthy (plan 5.2,
  "not responding") is not built here: it depends on 9.2's office-life `offWhen` field and is not in
  the N5-N7 beats or the brief's key points. The network-level and resource-level `downIf` outages,
  which the brief names, are complete. Flagged for a follow-up if the host-level outage display is
  wanted, and now tracked as a dated entry in `docs/IDEAS_BACKLOG.md` (review R1 MIN-3).

### Review R1 outcomes (`ACCESS_MODEL_SLICE_9_3B_O_CODE_REVIEW_R1.md`)

0 blocker, 1 major, 3 minor, 2 nit. All fixed bar one nit rejected with a reason.

- **MAJ-1** (overstated tamper-resistance): reworded `network_up?`'s docstring and the
  `network_outages_test` header to the real property. The outage global is client-syncable (plan
  5.2), so an outage is a soft gate, not a boundary; the guarantee is that clearing it reaches
  nothing without a server-held foothold and a host still demands its password. Renamed the N5 test
  and added two: a hostile `PUT /sync_state` clearing the global with no foothold (the network is
  still unreached and no `SERVER_STRINGS` are named, in the view or the bootstrap scenario), and one
  clearing it with a foothold (the host is reachable but a wrong password opens no session, the real
  one signs in).
- **MIN-1** (duplicated globals reader / truthy set): added one shared reader
  `Game#global_variable_value`; `outage_global` and `npc_frustration#frustration_global` now
  delegate to it, and `truthy_global?` delegates to `NetworkModel.truthy?`. Cross-reference comments
  on `NetworkModel.truthy?` made current.
- **MIN-2** (`session_route_up?` conservative nil-PC deny): added a comment stating the deny is
  deliberate and a happy-path test (a present, reachable remote PC passes, so a `find_login_pc` /
  `object_network` regression surfaces).
- **MIN-3** (deferred `offWhen` "not responding" host display): added a dated `docs/IDEAS_BACKLOG.md`
  entry and the pointer above.
- **NIT-2** (`0.0` falsy by `0.0 == 0`): noted in the `NetworkModel.truthy?` comment.
- **NIT-1** (two `resources.keys.sort` passes in `validate_network.rb`): not folded. Folding the
  resource-outage line into the reachable-share loop would drop outage lines for shares that fail
  that loop's `file_share` + `access` filter, so the separate pass is kept deliberately.
- Review rounds (AGENTS.md: Opus reviewer rounds) not yet done.
