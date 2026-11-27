# README slice 9.3b docs: round 1 fixes, build log

Branch `build/readme-93b`. Fixes the findings in `README_9_3B_DOCS_REVIEW_R1.md` (0 blockers, 2 majors, 3 minors, 7 nits).

## Engine

- **E2, `<apId>_planted` (review item 3).** `join()` in `network-links.js` now publishes the global as `load()` does, `heldAt(apId) !== null`: true for the access point the network was first joined at, false for a second one, with no reload needed. Node test in `test/js/network-links.test.mjs` (live values match a reload's).
- **E1 and M1, tasks on access points and implants (review item 4).**
  - Server: `complete_task!` (game.rb) has an access point branch. An `unlock_object` task on a Wi-Fi access point is met once its id is in `gainedFootholds` ("Not joined here" before). A second access point is met too (`record_gained_ap!`). An unlock of the object does not stand in for the join.
  - Client (`objectives-manager.js`): the `network_foothold_gained` listener skips `via: 'implant'`, and the `wasGained` load check skips a target whose held foothold is an implant (implant footholds are never removed, so `heldAt` is reliable). A new `network_joined` listener completes a task on the access point joined, a second access point included (that join answers `already` and fires no `network_foothold_gained`).
  - Tests: three Rails tests in `network_wifi_test.rb`; four node tests in `objectives-network-footholds.test.mjs`.
  - `test_access_networks`: N8 and N9 are `unlock_object` tasks on `guest_ap` and `guest_ap2`; their two `eventMappings` are gone. PLAYTEST.md updated.
- **E3, a down own network.** `network_view` sends `hosts: []` for a foothold whose own network is down (`network_up?`). Rails test in `network_outages_test.rb` (it fails without the fix). README line 939 is now true and says so for a foothold's own network.

Implants still meet no server-checked task. Whether they should is a question for the user (see Open).

## Docs and validator

- README: m1 (the SSID is never shown; the join prompt uses the access point's `name`), the M1 rewrite of the objectives paragraph (no recommendation of a skippable custom task), `<apId>_planted`, and nits n1 to n5.
- `scripts/validate_network.rb`: the stale reserved-field comment, the two empty constants and the dead loops are removed (n6); the off-path `grant_foothold` error now lists `completionActions`.
- `ACCESS_MODEL_SLICE_9_3B_PLAN.md`: 5.5 (both places) and the section 6 `POST /network/implant` row say the route picks the one action for a PC and shape; `path` is compared only when a request carries one. The section 9 validator line matches (n7).

## Tests run (affected files only, no lock)

- Rails: `network_wifi_test.rb` and `network_outages_test.rb` (25 runs), then every `test/controllers/break_escape/network_*_test.rb` with `game_test.rb` and `network_model_test.rb`: 273 runs, 3413 assertions, 0 failures.
- Node: `network-links` (66), `objectives-network-footholds` (8), every other `objectives-*` and `network-*` file, `validator-network-model` (63), and the eight files that import the changed modules: all pass.
- Validator on `scenarios/test_access_networks/scenario.json.erb --no-graph`: 0 ❌.

## Live proof

A keyless headless server on :3057 from this worktree; game 1735 (test_access_networks, store unlocked as a head start). The harness used `session-start.sh --headless` with `setFPS(20)` and fixed steps on. This game row's scenario copy only was given an extra `unlock_object` task on `door_box` and `downIf: servers_offline` on `guest_wifi`, for the proof.

- N8: the key typed at `guest_ap` joined; `n8_wifi_join` completed at once (server 200), `guest_ap_planted` true, no reload.
- N9: `guest_ap2` answered `already`; `n9_second_ap` completed at once, `guest_ap2_planted` false.
- Dropped implant: the stick was dropped in the store and `door_dock` was used. `implant_door_box` was granted and `network_foothold_gained` fired with `via: implant`. The door controller task stayed active, with no task request to the server and no alert. After a reload, `door_box` was in `gainedFootholds`, the task was still active, and still no alert or request appeared.
- Down own network: with `servers_offline` true and synced, `GET /network?foothold=wifi_guest_wifi` gave `hosts: []` and `networks: []`, with no share name in the body, and the view read "Nothing answers on this network.". On repair the `guest_notice` row came back.
- Server record afterwards: n8 and n9 completed, the door controller task not completed; `gainedFootholds` is `guest_ap`, `guest_ap2`, `door_box`.

A harness note: the first `interact guest_ap2` after closing the view landed out of range and did nothing (no request was sent). `moveToNear` then `interact` worked.

## Open

- A server-checked objective for an implant (its own rule, a task on the prop, or a new task type) is a user question, out of scope here.
- Optional (review item 2): a validator warning for a session-shape implant on a headless host; README note that a resource `downIf` is type-checked by the schema. Neither was done.

## Sync size

There is no new synced state. The join adds at most one boolean global per access point, written once per join. `gainedFootholds` is unchanged: it stays bounded by the scenario's jacks, access points and PCs.

# Round 2 fixes

Fixes the findings in `README_9_3B_REVIEW_R2.md` (0 blockers, 1 major, 0 minors, 4 nits).

## Fixes

- **M1, a held session on a down own network.** `networkBlocks()` in `network-view-minigame.js` now keeps the own network's block when its route is `down` (the up entry is still dropped, as its rows are the flat `hosts`). The block renders through the existing down branch: "<network> (no route)" and "No route to <host>" with no control. When that block is present and there are no own rows, the view no longer also says "Nothing answers on this network.". `allRows()` and the per-block `network_viewed` already skip down blocks.
  - The down look meets the pixel-art rule: `.network-block` has a 2px solid square border and a flat fill; `.network-block-down` and `.network-row-down` grey the title, row and text, and the icon is greyed with a filter at its whole-number scale. No radius, shadow or gradient; the "No route" text in a greyed row is upright (no synthesised slant on the pixel font).
  - Rails test in `network_outages_test.rb`: plant, remote sign-in to `lena_pc`, own network down. `hosts` is empty, one `down` block for `office_lan` holds only `lena_pc` with no `remoteSignIn` or `session`, the session is kept, and on repair the row is back in `hosts` with its session.
  - Node tests in `network-view.test.mjs`: the greyed own block with "No route to HB-FIN-02", nothing clickable and no "Nothing answers" line (it fails without the fix); and with the own network up, its block is not drawn a second time.
  - README line 939: "(a foothold on that network included: its own rows go, and only a session held there shows, greyed)".
- **n1.** A join at a second access point writes `<apId>_planted = false` over an unset global with no change event (`writeGlobal` with `deferEmit`, events dropped), as a reload writes it. A first access point still fires its change. The node test in `network-links.test.mjs` asserts both, and fails without the fix. README line 928 says so.
- **n2.** The first-join test in `objectives-network-footholds.test.mjs` stubs `serverCompleteTask` and asserts exactly one POST.
- **n3.** The E3 secrecy check in `network_outages_test.rb` no longer skips itself: it takes the compact list of host labels, asserts it is not empty and refutes each in the body.
- **n4.** README line 928: `network_viewed` fires for the foothold's own network even while that network is down, and a mapping whose beat needs a host tests `data.hostList`.

## Tests run (affected files only, no lock)

- Rails: `network_outages_test.rb`, 14 runs, 156 assertions, 0 failures.
- Node: `network-view` (24), `network-links` (66), `objectives-network-footholds` (8), `network-links-routing` (4), `access-remote-signin` (15), `escaping-shared-helpers` (20), `test-bridge-access` (12): all pass.
- Validator on `scenarios/test_access_networks/scenario.json.erb --no-graph`: 0 ❌.

## Live proof

A keyless headless server on :3096 from this worktree; game 1751 (test_access_networks, `--give kit_dropbox`). `session-start.sh --headless`, `setFPS(20)` with fixed steps on (set again after the reload). This game row's scenario copy only was given `downIf: office_down` on `office_lan`, with `office_down` declared false.

- Planted at `comms_port` (`jack_comms_port` on `office_lan`), then a remote sign-in to `lena_pc` from the view with Lena's details from the letter.
- `office_down` set true, view reopened: `hosts: []`, one `office_lan` block, route `down`, holding only `lena_pc`. The view reads "Harbour office LAN (no route)", "HB-FIN-02", "Lena's PC", "No route to HB-FIN-02", with nothing to click and no "Nothing answers" line. Screenshot: `ux-shots/branch/after_net/own_down_held_session_1751.png` in the session scratchpad.
- `office_down` set false, view reopened: `lena_pc` is back in the own rows with "Open (Lena Fox)"; the server network block is up again.
- Down again, synced, page reloaded and resumed: the same greyed block, the row text upright in GNF, the block border 2px solid. Screenshot: `own_down_held_session_after_reload_1751.png` in the same folder.
- Server record afterwards: `sessions.lena_pc` is `{ id: lena, via: password, foothold: jack_comms_port }`, `office_down` true, `footholds` has `jack_comms_port`.

A harness note: after a reload, `bootstrap` needs `"resume":"resume"` (`"continue"` fails on the resume menu).

## Sync size

No new synced state. The M1 fix is client rendering and tests. n1 writes the same one boolean global per access point as before, now with no change event for an unset-to-false write.
