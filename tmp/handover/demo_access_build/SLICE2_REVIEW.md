# Slice 2 review: demo_access_tour (access, kit and networks)

Scope: `git diff e4b4b86c9 ba7cd987b -- scenarios/demo_access_tour`. Server, security and access design. The Rails test was not reviewed or edited.

Counts: B0 / M0 / m2 / n2 (plus one open item, below)

Line refs are to scenario.json.erb at ba7cd987b unless named.

## Checks that passed

1. Secrets stay off the client.
   - Bootstrap: rooms keep only nav fields and `requires` goes for every pad lock (game.rb:2370-2385); `credentials` deleted (game.rb:2420); `networks`, `networkLinks`, `resources` deleted (network_access.rb:18, 23-26), so the Staff psk (scenario 42) and the Finance share's file never ship.
   - Room answers: `lockType: login` drops `contents` (game.rb:7088-7095), so facilities.txt with Lorna's password (scenario 165) and door_codes with the PIN (scenario 492) are served only by GET /container against a session. `credential` is stripped and `connect` is set server-side (game.rb:7133-7134); `network`, `linkName` go (game.rb:7137).
   - NPCs: `creds`, `role`, and every habit except screen and print are withheld (game.rb:7215, 7262-7276), so all five literals, including Julian's (scenario 14), are server-only. No NPC but Delphine and Yasmin has `writesDown`, so only their notes are served (GET /login_accounts).
2. Lorna's `rfidCard` (FAC-LORNA-01) in the open_plan answer is the normal pattern: `withhold_npc_secrets!` copies `creds.card` to `rfidCard` on purpose (game.rb:7267). The card id is not a secret. The copy is enforced on the server: POST /clone_card needs a held cloner, the card on the NPC's record and Lorna in encounteredNPCs (game.rb:4016-4026); the comms door counts the recorded clone only while a cloner is held (game.rb:3923-3939 path via rfid_passing_card_id/held_rfid_cards). Not a leak.
3. Access rules match plan 2.4 and 3.1: partner door `access.people [julian]` with no card for Julian (scenario 557, 545-546), so `rfid_identity_passes?` (game.rb:3896-3902) can never pass a held card; meeting room `requires [VISITOR-07]` only (598); comms `roles [facilities, it]` with only Lorna holding either (652, 452); each desk `access.people` its owner; door_controller `roles [facilities]` (484). Policies (34-36): no `autoLockMin` anywhere, which satisfies C5 (npc_frustration.rb:284-286, 305-308; client workstation-state.js:146, 324, 413 act only on a number). Every key is in the policy schema.
4. Credential chains: `lorna_door_pw` proof `session reception_pc`, foundIn `facilities_txt` (98-104), and the file sits only in reception_pc's withheld contents. `julian_rdp` proof `held julian_rdp_file` (105-111): the held proof is identity-strict on id, type and the server's own `credential` field (credential_keyring.rb:40-64), and the file is reachable only through a reception_pc session. Password kind is `connects: false`, so the door controller still needs the typed password from the network view.
6. Stops 2 to 10 and 17: each stop's server gate exists (visitor card, kit in the meeting room, live `meeting_jack` on office_lan, Finance share roles, Delphine's note, saved connection, `networkLinks` office_lan to server_lan, door_controller on server_lan, the keypad PIN, Lorna's sticky clone choice gated on `cloner_held`, the comms role). The `cloner_held` mapping on ama_phone (283-286) matches lab_physical_pentest:981, and `item_picked_up:<type>` is the emitted form (inventory.js:633, npc-game-bridge.js:40).
7. Networks: office_lan with Staff SSID and per-game psk, server_lan, guest with SSID and no psk (40-44); `networkLinks [[office_lan, server_lan]]` (47-49); `revealSecret` true (51); APs name the right networks (200, 211). Matches plan 2.3.
9. Nothing pre-empts slice 3: no injector, stick, rogue AP, capture tablet, USB hub, implant socket, managed port, patch panel, capture mapping or laptop affordance. `revealSecret` is set early, which the slice 2 brief lists, and it is harmless with no capture authored.

## Findings

### m1. The moved laptop and PC sit on the desk's top-left corner, not where they were
Evidence: scenario 336-340 and 372-376 put `thandiwe_laptop` and `yasmin_pc` at the desk's own `position` (3.1, 2.0) and (5.3, 2.0). Objects and tables both take top-left from `position` in tiles (rooms.js:598-599, 2300-2306). As table items they were offset by (14, 4) and (12, 2) px (removed lines in the diff). desk3 is 51x39, laptop1 24x18, pc3 26x22, so both now sit flush against the desk's left and top edges. Elevation 30 does put them in front of the desk (depth = bottom + 0.5 + 30, rooms.js:436-451). They also no longer belong to the desk's table group, so the behind-wall fade (rooms.js:2596) fades the desk and leaves them drawn when the player walks behind the north wall. Nothing else references the old placement (grep: only the plan, its reviews and the test).
Fix: restore the offsets: thandiwe_laptop `{ x: 3.54, y: 2.125, elevation: 30 }`, yasmin_pc `{ x: 5.675, y: 2.0625, elevation: 30 }`, then render the open plan once (mission-room-dressing) and check the walk-behind case. I did not render it.

### m2. julian.rdp carries a stray `needsTag`
Evidence: scenario 173, `"needsTag": "julian_rdp_file"`. Neither the plan (2.5) nor the fixture (test_access_keyring:153, 218-223) has one. `needsTag` marks an item the needs system may carry (npc-needs.js:3108, item-drop.js:6), and the file is `droppable`. No NPC has that interest today, but slice 4 adds needs to the open plan, and an NPC carrying the file off would break the `held` proof for Julian's route mid-tour.
Fix: delete the `needsTag` line.

### n1. Lorna's first meeting prints two lines back to back
Evidence: ink/lorna.ink 12-14 then 16-21: the intro line goes straight to `hub`, which says the greeting too ("Anything I can help with?").
Fix: set `hub_quiet = true` before the first `-> hub`, or leave it for slice 5, which replaces the ink.

### n2. Comment says the capture mapping repeats the psk "in a later slice"
Evidence: scenario 38-39. Correct for slice 3, but the psk render must be the same `@random_password` call in one binding (plan 3.1, scenario_binding.rb:22). Worth a one-line pointer for the slice 3 builder.
Fix: add "same binding: write `<%= @random_password %>` again, never a copy" to the comment.

## Open item (not counted)

player_state growth: resolved, not a finding. SLICE2_TEST_HANDOVER.md reported leaf count 132 to 145 after three repeats on the first draft. A probe (the test at b7a1c9bc1, which opens meeting_room before the plant, with a per-key leaf diff added) ran 'player_state does not grow when the short route is repeated' under tmp/tests.lock: 1 run, 12 assertions, 0 failures, and no key changed its leaf count. The earlier growth came from the first draft's failed plants, not from the scenario. The code agrees: every write these objects cause is bounded (network_access.rb:262-279, 300-309, 1805; game.rb:120, 4325, 4054).

## Not checked
- No live render or browser run on :3097 (m1's placement is from the code, not a screenshot).
- Client-side registration of ama_phone's mapping was taken from the established m02/lab pattern, not run.
