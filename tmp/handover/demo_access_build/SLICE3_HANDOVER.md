# Slice 3 handover (demo_access_tour): scenario built, nothing else done

## Done (one commit on build/demo-access-tour, scenario + regenerated dungeon graph only)
scenarios/demo_access_tour/scenario.json.erb now has:
- Reception: usb_hub (usb_bowl1, policy desk, requiresItem demo_stick), implant_socket (requiresItem kit_injector, confirm_action grant_foothold on reception_pc, needsSession, needsHeld kit_injector), planted_rogue_ap console (hiddenWith kit_rogue_ap; apScan Staff/Guest/two out of scope; one "wifi_key" apPortal template; cloneGlobals staff_twin_up; no apCaptureLog). Both plants changed from plant-large1 (a small plant, NOT a hiding spot) to planter_fig1 with interactable/active, as the lab does. Positions of the plants, hub and socket are unrendered.
- Meeting room: kit_injector (type usb, hid), demo_stick (storage), kit_rogue_ap (hideable rooms [reception], device planted_rogue_ap), capture_tablet (page-builder captures view), at x 3.85, 4.85, 5.85, 6.7 on y 3.9375 elevation 30.
- Comms cupboard: patch_panel (panelPorts managed_port, guest_vlan_port, spare), managed_port (portSecurity, message per plan), guest_vlan_port (panelOf patch_panel, network guest).
- thandiwe_laptop: work affordance, useFrom dx 0 dy 1.
- ama_phone: capture mapping npc_used:thandiwe_laptop, condition staff_twin_up, onceOnly, secret rendered by <%= @random_password %> again, proof planted kit_rogue_ap. completeTask t_capture_key left out on purpose (task does not exist until slice 5; add then). Global staff_twin_up declared.
- Validator: 0 errors, 18 warnings (all new ones are cluster-click warnings, see below, and the missing lighting emitter for planted_rogue_ap; no lighting block in this scenario, so decide in a later slice).

## Not done
- Rails devices test (test/controllers/break_escape/demo_access_tour_devices_test.rb): not written. Model on demo_access_tour_test.rb helpers and AccessDevicesRogueApScenarioTest (hide via POST inventory action_type hide, hidden_in reception_plant_west; record_capture via PUT sync_state se_captures; GET capture_secrets; POST network/join). Cases per plan 4.4: implant refusals and grant, ports after unplug (managed_port 422 reason port_security, box stays held; guest_vlan_port foothold on guest, no session ended), find_jack for all three jacks, capture before/after plant, Staff join with psk, wrong key refused, guest join with no key, door controller via implant foothold surviving unplug, julian_lost_with_desk not needed here (mapping is slice 5; brief listed it, so add it on ama_phone: pc_signed_out:julian_pc, condition data.reason === 'link_dropped' && data.fromPcId === 'reception_pc', setGlobal julian_lost_with_desk true / julian_back false; declare both globals).
- Mapping and globals: julian_lost_with_desk, julian_back not added yet (plan 2.10).
- Rendering: no server run. Use PLAYTEST_PORT-style copy of tools/playtest/lighting-tour.sh with port 3098 (script hardcodes 3001 on lines 61 and 65; start-keyless-server.sh hardcodes PORT=3001; copy both to the scratchpad and change). Screens to tmp/handover/demo_access_build/screens/. Check open_plan walk-behind for thandiwe_laptop and yasmin_pc, AP and meeting_jack positions, planter_fig1 plants (west at 2.1,3.3; east at 7.8,3.95 may block the east door approach), hub/socket on the counter.
- Validator cluster warnings: the meeting-room kit is 5 to 7 items in a 4.8 tile table, so items sit under 32 px apart (click may open the neighbour). Consider a second row or fewer items on the table (for example tablet and stick elsewhere); decide after the render. Same warning for hub and socket (16 px apart) and visitor_card near the socket.
- Ink compile, devices test run under flock, scoped corpus run (PAYLOAD_SCAN_ONLY=demo_access_tour RUN_OPENED_SCAN=1): not run.
- SLICE2 review n1 (Lorna double line) left.

## Gotchas
- Tour plants must not be plant-large1..10 (small plants are not hiding spots).
- Do not edit demo_access_tour_test.rb (test agent).
