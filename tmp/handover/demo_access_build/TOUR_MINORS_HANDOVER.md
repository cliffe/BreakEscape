# Tour minors handover (stopped at context guard)

Game 7625 (own, fresh, demo_access_tour full route) on :3096 (stopped; session and server stopped). Log: tmp/handover/demo_access_build/s10_7625.jsonl.
Played legitimately: kit, box planted, front desk sign-in, julian.rdp copy, sign-out, keyring connect, door controller (Lorna pw from facilities.txt), keypad 6956, Lorna cloner, comms cupboard via emulate, AP hidden in reception_plant_east.

## Item 2 (laptop tableItem): NOT DONE, needs engine changes
Server lookups (game.rb find_scenario_object, games_controller find_object_in_scenario, validator each_object_id) recurse only `contents`/`itemsHeld`, never `tableItems`, so a login pc nested in desk_thandiwe.tableItems would not be found for unlock/login/network/owner state. Also desk_thandiwe would become a dynamic table group (rooms.js 2279). Overlap rule is geometric anyway. Laptop does render on the desk (screens6/45).

## Item 4 lighting (screens6/43..48): reception, meeting_room, open_plan, server_room, kitchen, comms_cupboard all lit and readable (HUD panel covers left edge only). No fix needed. partner_office: cannot be entered legitimately (named-card door), not rendered; data uses the same top-level lighting on as the rest.
## Item 3 rogue AP LED: INCONCLUSIVE. 49_rogue_ap_led.png taken right after "Hide it": kit item left inventory, but no plant overlay or blue LED visible on reception_plant_east. Next: wait, check overlay sprite exists (hiddenWith overlay is declared at scenario line ~1048, in a reception-plant object hide block), and window.lightingSystem state emitters key planted_rogue_ap (lighting.js 740-925: emitter bound to object id; the object may never be a placed sprite since hiddenWith draws only an overlay, so the room emitter may not attach). Possible real fault: emitter keyed to an object that has no sprite.
## Item 1 debrief/end panel: NOT DONE. Remaining: unplug at meeting_jack (clickText Unplug), talk to ama (converse ama), choose "I'm done", Skip through lines taking screenshots, then end panel/credits (next numbers 50+).
## Gotchas: mg clickControl index is offset (index 0 = first real button, not x); clickText sometimes fails right after a state change, retry; keypad index = digit-1, 0 = 9.
