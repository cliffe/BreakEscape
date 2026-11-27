# Slice 2 handover (demo_access_tour): research done, nothing built yet

## Done (commits on build/demo-access-tour)
- 7dfc83da4 plan 2.2 and C3: reception_pc takes the lobby map's pc8 slot (AC0 item 1).
- 3cd967278 S1 sign (uni_doorcard1) moved y 3.1 to 2.9 (AC0 item 2).

## Not done
- All of slice 2 scenario JSON, ink knot, and test/controllers/break_escape/demo_access_tour_test.rb.
- AC0 item 3 (test opens meeting room with VISITOR-07 and refuses a card without that id) goes in the Rails test.
- AC0 item 4 (confirm scoped corpus run fails only on the m09 stale-exception artefact) after the build.
- Validator, corpus run (flock the main checkout tmp/tests.lock, PAYLOAD_SCAN_ONLY=demo_access_tour RUN_OPENED_SCAN=1), ink compile.

## Research findings (use these, do not re-derive)
- Models: scenarios/test_access_keyring (credentials, saved_connection, foundIn, policies, login PC with contents), test_access_networks (headless door box at ~927, resources/shares at 21+), test_access_devices (wifiAp objects ~205, lw_staff_ap/lw_guest_ap/lw_guest_card 16px sprites with no text, kit_dropbox pi_cluster1/drop_box1), test_access_doors (rfid), lab_physical_pentest/ink/len.ink (sticky clone choice; tag goes after last line with hub_quiet; ink var cloner_held, scenario global cloner_held, set by mapping item_picked_up:rfid_cloner).
- Passwords: define in the ERB header and interpolate (NPC creds and facilities.txt share one literal). Suggested: delphine, thandiwe, yasmin, lorna literals not used elsewhere; julian long strong one.
- NPC fields: role (reception, design, finance, facilities, partner), creds {username, password}, Lorna creds.card {name "Lorna Easton FAC card", card_id e.g. FAC-LORNA-01, rfid_protocol EM4100}; habits {writesDown:true} for delphine and yasmin; ink tag is # clone_keycard:<card_id>.
- PCs: lockType login, locked true, owner, network, host, policy, access {people:[..]}; no postitNote (server builds note from owner habits.writesDown); yasmin_pc locksScreenOnLeave true; thandiwe_laptop lockChance 0; door_controller headless true, lockType login, network server_lan, access roles facilities, contents door-codes text with the rendered PIN (server_room_pin var already in ERB header).
- Policies: desk (autoLockMin null, usb storage_blocked, remote allowed), partner, infra; defaultPolicy desk. C5 confirmed: autoLockMin read only for guest and claim sessions (app/models/break_escape/npc_frustration.rb:281-306).
- Networks: office_lan wifi {ssid MerrinSallow-Staff, psk <%= @random_password %>}, server_lan, guest wifi {ssid MerrinSallow-Guest} no psk; networkLinks [[office_lan, server_lan]]; social.captures.revealSecret true; resources client_letters (open) and finance_share (access roles finance, partner), both office_lan.
- credentials: lorna_door_pw {kind password, account lorna, proof {session reception_pc}, foundIn facilities_txt}; julian_rdp {kind saved_connection, account julian, connectsTo julian_pc, proof {held julian_rdp_file}}. julian.rdp file: text_file, takeable, credential julian_rdp, onRead.setVariable seen_julian_rdp, onPickup.setVariable has_julian_rdp (schema 5248, 5259). Declare globals seen_julian_rdp, has_julian_rdp, cloner_held (false).
- Meeting room kit: map has 4 tables (tile x about 2.6 to 7.4, items at y about 3.9); lab pattern is position {x, y 3.9375, elevation 30}. Existing table_items at x about 2.65, 4.4, 6.25, 7.1: put cloner at x 3.3, drop box at x 5.3. meeting_jack: networkJack true, network office_lan, jackConfirm; foothold id is jack_meeting_jack.
- Mapping for cloner_held goes on ama_phone (plan: it holds all mappings). ama_phone is already in reception npcs.
- Rails test helpers: test/support/network_model_scenario.rb NetworkRequests (plant, unplug, sign_in with foothold:, container, logout via POST logout, network_view, sync_globals, bootstrap_scenario, game_path); model on access_devices_rogue_ap_test.rb AccessDevicesRogueApScenarioTest (Mission.create! name demo_access_tour, Game.create!, scenario_data from DB); credential login via POST login {pc_id, credential, foothold|from}; clone via POST clone_card {card_id, npc_id}; door unlock POST unlock {targetType door, targetId, method rfid, card_ids}. GET login_accounts {pc_id} serves notes.
- Slice 2 test scope: secrets, access (partner door vs visitor card and Lorna clone, comms with recorded clone, keypad, door controller via box needs julian session, meeting room VISITOR-07), Finance share, foothold route/from route/desk sign-out unplug cases, find_jack for meeting_jack only. Implant-based door controller case and the other jacks belong to slice 3 (injector, ports not built yet).

## Gotchas
- Mission row exists in shared dev DB (made by slice 1). Never db:create/schema:load/migrate/reset.
- APs go on reception back wall y about 1.6 (unverified by render); guest card near (6.9, 3.95).
