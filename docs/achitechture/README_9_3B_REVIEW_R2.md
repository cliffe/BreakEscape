Counts: 0 blockers, 1 major, 0 minors, 4 nits.

# README slice 9.3b and engine fixes: review, round 2

Branch `build/readme-93b`, tip 7fe97ac4f. Reviewed: `git diff main...build/readme-93b` (the branch's own six commits from merge base 6a834437c). The two-dot diff also shows the owner claim files as deleted; that is main having moved on since the merge base, not this branch. `git merge-tree` merges the branch into main with no conflict, and main's changes to game.rb do not touch `complete_task!`.

## What was checked and holds

- **Forged task POST on an access point.** `complete_task!` (game.rb:3151-3155) reads `gained_footholds`, and only server routes write `gainedFootholds`: `plant_device!`, `join_network!` (after the reach test and the key test), `record_gained_ap!` (only when the network's Wi-Fi foothold is already held and the second access point is reachable) and `implant_foothold!`. `sync_state` merges no `gainedFootholds` section. A POST for an access point task before a join is refused "Not joined here", and an `unlockedObjects` entry does not stand in for the join (network_wifi_test.rb, three tests). This meets the cheat policy.
- **The `network_joined` listener** (objectives-manager.js:348-350). It fires only after a server success in `join()` (network-links.js:625). On a first join it and the `network_foothold_gained` listener both call `handleObjectUnlock(apId)`, but `completeTask` sets `status = 'completing'` before its first await, so the second call returns and only one POST goes out. `load()` emits no events, so nothing fires on reload; the reload path is the reconcile in `checkExistingProgress`, which agrees with the server. A join refused by reach or key emits nothing.
- **The implant skip.** `network_foothold_gained` with `via: 'implant'` is ignored, and the load reconcile skips an id whose held foothold is an implant. Server side an implant foothold is never removed (`unplug_device!` finds only jacks), so `heldAt` is a reliable test. A task on the implant's PC still completes on a real sign-in through `pc_signed_in` or `wasSignedIn`. Proven live in the build log (game 1735).
- **`<apId>_planted`.** `join()` writes the same value `load()` writes (`heldAt(apId) !== null`), and the node test compares the live values with a reload's.
- **Secrets.** No new field or answer carries an SSID, a PSK or `linkName` beyond what was already sent (the link item name, by design). "Not joined here" says only that the target is an access point, which the scenario's own task list already shows the client.
- **Sync size (q77).** No new player_state key. `gainedFootholds` is unchanged and bounded by the scenario's jacks, access points and PCs. The join adds at most one boolean global per access point, written on each join through `writeGlobal`, which emits a change event only when the value changes.
- **Validator cleanup.** No remaining reference to `NETWORK_RESERVED_*`; the off-path `grant_foothold` error lists `completionActions`, matching `DeclaredGrants.executed?`.
- **R1 findings.** M1, m1, n1 to n7 and E1, E2 are resolved as R1 asked (README lines 905, 915, 928, 941, 961, 963; plan 5.5 and the section 6 implant row). E3 is resolved for a foothold with no held session but regresses the held-session case (M1 below).
- **README against the code.** Lines 896 to 965 read fresh against network_access.rb, network-links.js, objectives-manager.js, network-view-minigame.js, password-minigame.js:237 and validate_network.rb. Every claim matches except line 939 (M1).

## Tests and validator

- Rails, no lock: network_wifi, network_outages, network_footholds, network_implants, network_host_service_off, network_pivot, network_no_exposure, network_remote_signin, network_shares: 153 runs, 2868 assertions, 0 failures.
- Node: network-links (66), objectives-network-footholds (8), validator-network-model (63), network-view (22), and every other objectives-* file: all pass.
- `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb scenarios/test_access_networks/scenario.json.erb --no-graph`: 0 ❌, and no warning about the new `unlock_object` tasks on `guest_ap` and `guest_ap2`.
- A throwaway probe test (deleted after the run) proved M1 against the server.

## Findings

### M1 (major): a held session on the foothold's own network vanishes from the view while that network is down

- Where: network_access.rb:609-612 (the E3 change) with network-view-minigame.js:176-180 (`networkBlocks()` drops every block whose id is the own network).
- Failure scenario. Office LAN has `downIf: office_down`. The player plants at `comms_port` and signs in to `lena_pc` remotely through the foothold. `office_down` goes true. The probe showed the server answers `hosts: []` and `networks: [{ id: "office_lan", route: "down", hosts: [lena_pc row] }]`: a greyed block with the held session, as plan 5.2 asks. The client drops that block because its id is the own network, so the view says only "Nothing answers on this network." and the held session on HB-FIN-02 is gone from the view. Before this change the flat own rows still listed `lena_pc`. Plan 5.2 says "a held session is never silently missing", and README line 939 says a held session over a downed route "shows as a greyed block with "No route to <host>"", while the same line also says a foothold on a down network "then lists nothing". The two clauses now disagree, and the code follows neither cleanly.
- Fix.
  1. network-view-minigame.js `networkBlocks()`: keep the own network's block when `route === 'down'`, i.e. filter `b.id !== own || b.route === 'down'`. The block renders through the existing `blockSectionHtml` down branch ("<network> (no route)", "No route to <host>"), `allRows()` already skips down blocks, and `network_viewed` already skips them. Optionally drop the "Nothing answers on this network." line when that down block is present, so the view does not say both.
  2. Rails test in network_outages_test.rb: the probe above, asserting `hosts == []` and one `route: "down"` block for `office_lan` holding exactly the `lena_pc` row with no `remoteSignIn` or `session` key; and that the row is back in `hosts` on repair with its session.
  3. Node test in test/js/network-view.test.mjs: a view with empty `hosts` and a down block for the own network renders the "No route to" row.
  4. README line 939: replace "(a foothold on that network included, which then lists nothing)" with "(a foothold on that network included: its own rows go, and only a session held there shows, greyed)".
- Size: about an hour. State: none.

### n1 (nit): the live join at a second access point emits a `false` change event that a reload never emits

- Where: network-links.js:621.
- Failure scenario. A join at `guest_ap2` writes `guest_ap2_planted = false` over `undefined`, which counts as a change, so `global_variable_changed:guest_ap2_planted` fires with `false`. A mapping an author keys on that event (guessing from the jack pattern) fires on a join that publishes "not planted". `load()` writes straight into the globals, so a reload emits nothing. Harmless today, and README line 928 already points authors at `network_joined:<apId>`.
- Fix: none needed in code; optionally add "(no change event is worth mapping for a second access point)" to README line 928, or skip the write when the value is `false` and the global is unset.

### n2 (nit): the first-join node test does not prove a single POST

- Where: test/js/objectives-network-footholds.test.mjs, the test "network_joined at an access point completes its unlock_object task".
- Failure scenario. The test fires both `network_joined` and `network_foothold_gained` and checks only the final status. If the `completing` guard in `completeTask` were ever loosened, two POSTs would go out (and on a concluding task, two ending checks) with the test still green.
- Fix: stub `m.serverCompleteTask` with a counter and assert it ran once.

### n3 (nit): the E3 test's secrecy check can skip itself

- Where: test/controllers/break_escape/network_outages_test.rb:302.
- Failure scenario. The `refute_includes` loop runs only `if up['hosts'].all? { |h| h['host'].present? }`. If the fixture ever gains a row with no `host` (a resource with none, say), the whole check is skipped without a word and the test still passes.
- Fix: drop the trailing `if` and loop over `up['hosts'].map { |h| h['host'] }.compact`, asserting the list is not empty first.

### n4 (nit): `network_viewed` still fires for a down own network

- Where: network-view-minigame.js:154-156; README line 928.
- Failure scenario. With the own network down, opening the view still emits `network_viewed` with that `networkId` and an empty `hostList`. A mapping such as `data.networkId === 'office_lan'` (the README's own pattern) completes "look at what the office LAN exposes" during an outage, when the view shows nothing.
- Fix: either say so in README line 928 ("once for the foothold's own network, even while it is down; test `data.hostList` when the beat needs a host"), or skip the own-network emit when the answer's `hosts` is empty and no up block exists. The README sentence is the smaller change.

## Sync size

No finding adds synced state. The M1 fix is client rendering and a test only. Per sync, the branch adds at most one boolean global per access point, sent once when it changes.
