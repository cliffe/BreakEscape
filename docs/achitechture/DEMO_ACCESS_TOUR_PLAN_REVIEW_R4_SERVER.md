# demo_access_tour plan: review R4 (server enforcement, security model, sync; delta)

Plan: docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md v4 at 4e8a25cde. Previous round: DEMO_ACCESS_TOUR_PLAN_REVIEW_R3_SERVER.md (0aab435ed). Plan line numbers refer to v4.

Counts: B 0, M 0, m 3, n 2

## R3 resolution

| R3 | Status | Where in v4 | Note |
|---|---|---|---|
| M1 PIN substring false positives | RESOLVED | 626, 631 | Leaf walk, whole-token match, JSON path printed, the before and after pass rule. A smaller residue of collisions is left: see m3. |
| m1 door controller survival needs an office_lan session | RESOLVED, with one wording fix | 79, 315, 591, 622 | The condition matches the prune: `prune_unreachable_sessions!` keeps a foothold session only while its PC's network is in some held foothold's `structural_reach` (network_access.rb:1446-1469), and server_lan is added only from a held session host on office_lan (network_access.rb:1255-1281, 1398-1412). The new 4.4 logout case does not say when the logout happens: see m1. |
| m2 jack fields | RESOLVED | 236-239, 592, 648 | Field for field as the fixture: `secured_port` and `guest_port` (test_access_devices:364-390), `p3_patch_panel.panelPorts[].jack` (346-352). `find_jack` needs `NetworkModel.jack?` and a network the scenario defines (network_access.rb:99-107); `guest` and `office_lan` are both defined (plan 160-163). `guest_vlan_port` is reached through `panel_unlocked?` (network_access.rb:129-137). |
| m3 leak corpus | PARTIAL | 625 | GET /network and the six POST answers are in. Several other answers the walk gets are not, and the decision on request bodies is not written down: see m2. |
| n1 read-only setup and secret paths | PARTIAL | 624 | The three paths are right (below). The flag list leaves out flags that also write the game: see n1. |
| n2 skipIfGlobal citation | RESOLVED | 403, 407, 416 | `skipIfGlobal` inside `sendTimedMessage`, checked at delivery (npc-manager.js:1712-1722, 2540-2546). |

## Delta checks, confirmed

1. Game-row paths for the leak proof (624). `Game#scenario_data` is the rendered copy, and the client filters work on copies of it, never on the row:
   - `networks.office_lan.wifi.psk`: the join reads `ap[:wifi]['psk']` (network_access.rb:372), and the fixture authors it there (test_access_devices:18).
   - The server_room lock's `requires`: stripped only from the client copies (game.rb:2385, 7091, 7211), so the row keeps it.
   - `creds.password`: the server reads `npc['creds']['password']` (game.rb:2644, 3338).
   - The capture mapping's `addCapture.secret` (plan 304) holds the same psk render. It is removed from client payloads under CAPTURE_SECRET_KEYS (game.rb:7041-7045), so the leak proof is right to expect no psk before the capture.
   - ama_phone holds no creds, so `account_capture_passwords` (game.rb:2638-2657) serves no password for it. Thandiwe holds no `addCapture` mapping, so hers is never served either.
2. The proof never writes the row. `rails runner` with `Game.find(id).scenario_data` is a read. The only writer is new-game.rb (n1).
3. Request bodies need not be scanned. A request body carries only what the client already holds: either it came in a response the proof scans, or the player typed it after earning it. Delphine's password on POST /login and the PIN on POST /unlock are the legitimate cases. Scanning bodies would flag those and catch nothing the response scan misses. The gap is in the responses: see m2.
4. Port fields (236-239). `managed_port` has `networkJack`, `network: "office_lan"`, `portSecurity`, `portSecurityMessage` and `jackConfirm`, as `secured_port` has (test_access_devices:364-372). The refusal comes before the device is looked at (network_access.rb:233-245), so no `linkName` is needed. `guest_vlan_port` has `networkJack`, `network: "guest"`, `panelOf`, `linkName` and `jackConfirm`, as `guest_port` has (382-390). `patch_panel.panelPorts` names it under `jack` (as at 346-352). A plant at each of the three jacks resolves through `find_jack`.
5. Door controller survival wording (79, 315, 622). On the full route, stop 17 still ends door_controller when it was opened at the box: `end_sessions_through!(foothold_id)` ends it directly (network_access.rb:312), whatever else is held. When it was opened from the implant's link, its foothold is `implant_reception_pc` (network_access.rb:428-430). It survives the unplug only while a session host on office_lan is held. Any held session counts, claim or remote, but not a relay or an expired token (network_access.rb:1398-1412). "Another office_lan session" is accurate.
6. `julian_lost_with_desk` (392-393).
   - A desk sign-out goes `signOut`, then POST /logout. `logout_session!` prunes, and `from_session_pruned?` ends a `from` session whose source is gone (game.rb:3573-3590; network_access.rb:1378-1391). The pruned ids come back to `linkDropped(ended, 'route_ended')` (pc-sessions.js:779-799).
   - `linkDropped` emits `pc_signed_out` with `reason: 'link_dropped'` unless the session is an expired token (pc-sessions.js:887-888). `_remoteOf` adds `fromPcId` (pc-sessions.js:958-964), which the server put in the sign-in answer (game.rb:4364-4367).
   - The condition uses only `===` and `&&` on `data.` operands with string literals, which the evaluator supports (npc-manager.js:100-130). An eventMapping `setGlobal` with two keys is applied key by key (npc-manager.js:1500-1506).
   - A box-route Julian session has no `fromPcId`, so the unplug never matches. Julian's own sign-out has reason `sign_out`. Both claims in 392 hold. See n2 for desks other than reception_pc.
7. player_state. Removing `julian_via_desk` takes the declared booleans to 27 (515). `julian_back` resetting to false is a change of an existing key, sent as a delta (state-sync.js:33-41). With P6 on a cooldown, `triggeredEvents` has 9 fixed keys (518), and cooldowns live in memory. Nothing grows.

## minor

### m1. The 4.4 logout case does not say when the logout happens or what else is held
Plan 591: "With that session signed out first, POST /logout on reception_pc lists door_controller in the ended list." Plan 622 says the same. The logout ends door_controller only if, at that moment, no other session host on office_lan is held (network_access.rb:1255-1281, 1446-1469).

If a builder signs out of reception_pc before the unplug, with Julian's box session still up, Julian's session keeps server_lan in reach. The logout's ended list then lacks door_controller, and the unplug ends it in its prune round. The case fails as written, though the server is right. The same happens if a thandiwe_laptop claim or a yasmin_pc session is held at the time.

Fix (591 and 622): "After the unplug, with no other office_lan session held (no Julian, thandiwe_laptop or yasmin_pc session), POST /logout on reception_pc lists door_controller in its ended list."

### m2. The leak corpus is still a hand list, and it misses answers that carry scenario text
Plan 625 lists the bootstrap, GET /room, /keyring, /capture_secrets, /container, /login_accounts and /network, and six POST answers. The walk also receives:
- GET /ink for each NPC. The compiled file is served as it is (games_controller.rb around 692-721), so the random PIN and psk cannot be in it. The five passwords are literals (plan 184-188), though, and a hint or debrief line that names one would reach every client from the start.
- GET /objectives (games_controller.rb:1705) and GET /scenario_map.
- POST /unlock (keypad, RFID doors, containers), /update_room, /inventory, /clone_card and /lock_session. Each answers with room or inventory data.

Fix:
- Record the body of every response the script receives under `/break_escape/games/:id/`, whatever the route. Add GET /ink for every NPC with a `storyPath`, fetched once at the start.
- Keep the pass rules as they are. Print the route with each hit's JSON path.
- Add one sentence saying request bodies are not scanned, and why (delta check 3), so the next reader does not reopen it.

### m3. The whole-token PIN match still collides with authored numbers and dates
The PIN is any of 1000 to 9999. The whole-token rule (626) still counts a hit in:
- A numeric leaf that the scenario itself authors. The tour's own timed texts use delays of 4000, 5000 and 6000 (plan 407-414), and those mappings reach the client in the NPC data, because the client runs them. A PIN of 4000, 5000 or 6000 fails the "no hit before" rule at load every time. Pixel positions and sizes in the same range give random hits.
- An ISO date string. `(?<![0-9])2026(?![0-9])` matches "2026-11-17T09:00:00Z", because `-` is not a digit. A PIN from 2024 to 2027 then hits wherever the answers carry a timestamp.

The chance per run is small, well under one in a hundred, but the failure is real and the proof is meant to run every build.

Fix (626 and 631). Classify each pre-session hit before failing:
- A numeric leaf under a layout or timing key (`x`, `y`, `width`, `height`, `delay`, `cooldown`, any key ending in `Ms`) is reported as a collision.
- A string leaf whose whole value is an ISO date or time is reported as a collision.
- Every other hit fails.

A simpler alternative: on a pre-session hit, create a second game and fail only if the same JSON path carries the second game's own PIN. A real leak follows the PIN to its path; a collision does not.

## nit

n1. new-game.rb has more flags that write the game than the four the plan names (624). `--start-room` and `--carry-npc` rewrite this game's scenario copy. `--submit-flag`, `--imports` and `--seed-full-cloner` write state (new-game.rb:28-69, 87-89, 95, 106). Say: "new-game.rb with the mission id and no other argument".

n2. `julian_lost_with_desk` matches only `fromPcId === 'reception_pc'` (392). A `from` source can be any held session (`from_route_refusal`, network_access.rb:1349-1373), and the keyring picks the most recently opened source desktop (keyring.js:75-87). Two routes give the wrong debrief or hub line:
- Julian Connected from a thandiwe_laptop claim at stop 12 or from yasmin_pc at stop 13. Losing that desk drops Julian with `fromPcId` set to that desk, so no global is set. With no unplug, the debrief gives D5b ("Julian's session stayed up ...") although it went down.
- A reception_pc session that is itself remote through the box. The unplug ends it and prunes Julian with `fromPcId: 'reception_pc'`, so the global is set. D5a still wins in the debrief, but W6b ("went when you signed out at the front desk") then shows in the hub after an unplug.

Both are off the presented route. Fix one of two ways:
- Widen the condition to `data.reason === 'link_dropped' && data.fromPcId`. Word D5c and W6b as "the desk you connected from" and not as Delphine's. Add `not julian_ended_by_unplug` to W6b.
- Or note in 2.7 that only the front desk route is scripted, and accept D5b on the others.
