# demo_access_tour plan: review R3 (server enforcement, security model, sync; delta)

Plan: docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md v3 at 3a1fae639. Previous round: DEMO_ACCESS_TOUR_PLAN_REVIEW_R2_SERVER.md (9f415ef21). Plan line numbers refer to v3.

Counts: B 0, M 1, m 3, n 2

## R2 resolution

| R2 | Status | Where in v3 | Note |
|---|---|---|---|
| B1 stop 10 needs the box still in meeting_jack | RESOLVED | 282, 289-290, 293, 338, 373, 409, 582, 603, 648 | The plan took the alternative: the ports move to stop 18, after the unplug, using the same box. Server path checked below (delta 1). |
| M1 door controller signed in through the view's foothold | RESOLVED | 75-79, 279, 312, 362, 574, 586, 615-616 | Wording matches network-view-minigame.js:688-695 (`start(row, footholdId)` for a sign-in; `openFromDesktop` only for `open` on a `from` session). The survival cases need one more condition: see m1. |
| M2 leak proof has no list | RESOLVED, with corrections | 596, 617-623 | A script of its own, read-only on the row. See M1 and m3. |
| M3 capture mapping under-specified | RESOLVED | 88, 295-306, 580 | Same fields as the fixture (test_access_devices:280-281). ama_phone holds no creds, so `served_capture_writers` keeps it (capture_model.rb:540-551), and `target_capture_proofs` takes the mapping's `proof` because the address is no username (capture_model.rb:957-970). Nothing is needed on Thandiwe. |
| m1 `onPickup.setVariable` | RESOLVED | 223 | |
| m2 door_controller lock type | RESOLVED | 238, 487, 567 | |
| m3 implant with the stick | RESOLVED | 83, 498, 578 | |
| m4 Yasmin's note is a client gate | RESOLVED | 57, 313, 500, 565 | |
| m5 guest Wi-Fi placement | RESOLVED | 166, 581 | |
| n1 `front_desk_signed_out` repeat | RESOLVED | 388, 397 | |
| n2 keyring citation and tie rule | RESOLVED | 73 | keyring.js:69-74 and 75-88 match. |
| n3 capture secret citation | RESOLVED | 493 | |

R2's "not checked" items are now settled: V8 counts `npc_used:` mappings (`npc_used` is in OFFICE_LIFE_EVENT_PREFIXES, scripts/validate_office_life.rb:54-57), which the plan's count of 3 (514) already includes. The known client needs no network field (87).

## Delta checks, confirmed

1. Stop 17 then stop 18 with one box.
   - The unplug puts the stored copy back in the inventory unless an identical item is already held (network_access.rb:303-308).
   - `held_rogue_device` finds it again, since it is the server's own copy and not client-forged (network_access.rb:143-166).
   - The managed port refuses before the device is even looked at. Reachability comes first, then `port_security_refusal` (network_access.rb:233-245), and the device stays held. The client then emits `network_device_refused:managed_port` with `reason: 'port_security'` (network-links.js:435-442), so P4 fires.
   - The guest VLAN port goes through `panel_unlocked?` (network_access.rb:129-137), then writes a foothold on the port's own network and adds `guest_vlan_port` to `gainedFootholds` (network_access.rb:262-266).
   - `hide_device_in_its_room!` adds `kit_dropbox` to `objects_removed` only once (network_access.rb:1797-1806).
   - t_guest_port completes: client side through `network_foothold_gained` with `sourceId` (objectives-manager.js:368-375); server side because `unlock_object` on a jack checks `gainedFootholds` (game.rb:5165-5178).
   - Nothing keyed on `:meeting_jack` fires for this plant.
   - Subject to m2.
2. julian.rdp desktop route.
   - Connect on the desktop takes a copy, which fires `onPickup`. It then calls `keyring.connect` with `from` set to the desktop's PC (container-minigame.js:2028-2056).
   - The server's answer carries `remote` and `fromPcId` (game.rb:4367). `signInWithCredential` keeps them through `remoteFields` (pc-sessions.js:603-611, 239-245), and `_remoteOf` puts `fromPcId` on `pc_signed_in` (pc-sessions.js:958-964). So `julian_via_desk` fires on the bare-operand condition.
   - Sign out at reception_pc runs POST /logout. `logout_session!` deletes the session, then `prune_unreachable_sessions!` ends Julian's session through `from_session_pruned?` (game.rb:3573-3590; network_access.rb:1446-1469).
   - `pc_signed_out:reception_pc` with `reason: 'sign_out'` is emitted before `linkDropped` closes Julian's desktop (pc-sessions.js:783-799). The `julian_lost_with_desk` condition reads only globals and the reason, so the order does not matter.
   - The keyring reconnect after that has no `from` row, because no desk session is held, so it takes the foothold. `julian_back` then fires.
   - P0's `skipIfGlobal` is checked when the text is delivered, not when the event fires (npc-manager.js:1721). So a Connect that completes t_julian_pc within 4 s suppresses it.
3. Door controller wording: confirmed (R2 M1 row above).
4. Cake in `startItemsInInventory`: no server issue.
   - Start items are copied into the server inventory at game creation (game.rb:7422-7440) and carry no `clientAdded` marker, so `client_forged?` (item_identity.rb:40-41) never applies.
   - test_needs_sims ships the same cake as a start item (scenario.json.erb:93-105).
   - Magnet and servings logic is client only. The magnet counts toward V8 `magnet servings` and `dropped magnet items` (validate_office_life.rb:786-790), as 3.2 says.
5. player_state growth.
   - 28 declared booleans plus `cake_servings` (509).
   - The route globals come from mappings with no onceOnly, which write `true` once, and sync sends only changes (state-sync.js:33-41).
   - `triggeredEvents` takes only onceOnly and maxTriggers keys (game.rb:5711-5732), so 10 fixed keys.
   - Cooldowns live in memory (npc-manager.js:1279-1281).
   - A replant adds no new key: `footholds` holds one entry per jack, `gainedFootholds` at most 5, and `objects_removed` is deduplicated.
   - V8 cap names match BUDGET_CAPS (validate_office_life.rb:766-770).
   - Nothing grows.

## Major

### M1. The leak proof's PIN check will give false positives on a plain substring scan
Plan 617-621 scans "the whole raw bootstrap" and every answer for the rendered keypad PIN, as the pattern tool does with `String(text).toLowerCase().includes(secret)` (secret-leak-withholding-live-proof.mjs:140). `@random_pin` is a 4-digit number, `rand(1000..9999)` (scenario_binding.rb:24). The corpus scan already declines this exact match: "it cannot see a secret shorter than 6 characters ... embedded in a longer string ... (4821, 1234 ... occur in ordinary text, dates and room numbers)" (test/support/payload_scan.rb:19-25).

The bootstrap carries many digit runs: coordinates, sizes, timestamps, ids and audio paths. A random 4-digit value therefore has a real chance of appearing in one of them before any door_controller session. The proof would then fail at random, or a builder would loosen it ad hoc. The pattern tool avoids the problem only because its PINs are fixed and chosen by hand.

Fix (in 4.7, plan 617-621):
- Parse each JSON answer and walk its leaves.
- Count a PIN hit only when a leaf equals the PIN, as a string or a number, or when a string leaf contains it as a whole token (`(?<![0-9])PIN(?![0-9])`).
- Print the JSON path of every hit.
- Pass when no hit appears before the door_controller session, and at least one hit, in the door-codes file, appears after it.
- The 8-character Staff key and the literal passwords can keep the plain substring check.
- Before writing the five passwords, check that none of them is an ordinary word that appears elsewhere in the scenario text.

## minor

m1. A session opened from the implant's or Staff Wi-Fi's link item survives the unplug only if some other office_lan session is still held. The prune reruns structural reach after the unplug, and reach to server_lan crosses the network link only from a held session host on office_lan (network_access.rb:1255-1281, 1398-1412, 1453-1467). The door controller sits on server_lan. When the unplug ends Julian's box session and no other office_lan session is held, the next prune round ends the door controller session too, implant foothold or not. The plan states survival without this condition:
   - 79 and 312
   - 4.4 case 586
   - 4.7 616

Fix: in each of those places, add "while another office_lan session is held (for example the reception_pc keyboard session the implant needs)". In 4.4, after the surviving case, add: "POST /logout on reception_pc: door_controller is now in the ended list". On the full route this already holds at stop 17, since stop 14's keyboard session is still held (289).

m2. The two cupboard ports need their jack fields, or the server answers 404. `find_jack` needs `networkJack: true` and a network the scenario defines, either the object's own `network` or the room's (network_access.rb:99-107; network_model.rb:38-52). Without them the plant answers 404 "Jack not found", the client shows "The port did not respond" (network-links.js:443-445), P4 never fires and t_guest_port never completes. Plan 235-236 gives neither field.

Fix: follow the fixture (test_access_devices:342-390).
- `managed_port`: `networkJack: true`, `network: "office_lan"`, `portSecurity: true`, `portSecurityMessage`, `jackConfirm`.
- `guest_vlan_port`: `networkJack: true`, `network: "guest"`, `panelOf: "patch_panel"`, `linkName`, `jackConfirm`.
- `patch_panel`: a port list naming `guest_vlan_port` under `jack`.

Add "every jack resolves through find_jack" to slice 3's proof.

m3. The leak proof leaves out some answers that carry network and inventory data. Plan 617 lists the bootstrap, GET /room, /keyring, /capture_secrets, /container and /login_accounts. It omits:
   - GET /network, the network view (games_controller.rb:1715-1720), which draws server_lan and its hosts at stop 7.
   - The POST answers the walk receives: /login, /network/plant, /unplug, /join and /implant. These carry footholds and inventory deltas (network_access.rb:205-229).

Fix: scan every GET /network answer, and the body of every POST the walk sends, against the same before and after rules.

## nit

n1. Plan 617 says the proof reads the row "and nothing else", but new-game.rb also has `--set`, `--give`, `--unlock` and `--complete-task` flags, which write game state. Say the proof calls new-game.rb with no state flags. Name the paths it reads:
- The psk: `networks.office_lan.wifi.psk`.
- The PIN: the server_room keypad's `requires`, wherever slice 1 puts it.
- The passwords: each NPC's `creds.password`.
Then a builder does not search the whole row for them.

n2. 4.6's Desktop Connect walk (605) relies on P0 being dropped when the text is delivered. Add the citation to 2.10's P0 note (412): `skipIfGlobal` is checked at delivery (npc-manager.js:1721), and the onceOnly key is spent either way.
