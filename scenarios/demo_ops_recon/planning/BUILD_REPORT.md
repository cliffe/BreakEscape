# demo_ops_recon: build report (unit R-S, wave 1)

Validator: `ruby scripts/validate_scenario.rb scenarios/demo_ops_recon/scenario.json.erb --no-graph` gives 0 errors, 26 warnings (ink from unit R-I had landed). Door alignment passes. `tools/check_mapping_index_drift.rb main` skips a new scenario.

## Probes

**P3 (id form the confirm sends).** The finding id is built as `<host>.<service>.<finding>` (`lib/break_escape/network_model.rb:396-398`); the confirm sends it as `findingId` and emits `network_finding_confirmed:<findingId>` (`public/break_escape/js/minigames/network-view/network-view-minigame.js:1071`, `_emit` adds the suffix at `:275-282`). So the two suffixes are `network_finding_confirmed:printer_host.admin_page.factory_login` and `...old_build`. The same file gives `network_host_scanned:<hostId>` (`:1066`), `network_service_checked:<host>.<service>` (`:1069`), `network_technique_used:<findingId>` (`:1074`). `scan_printer` ticks on `network_host_scanned:printer_host` (no condition needed). `plug_in` ticks on `network_foothold_gained:hotdesk_jack` (`public/break_escape/js/systems/network-links.js:467`).

**Host sprite (5.3).** A host `sprite` is only the row icon in the network view (`network-view-panels.js:672-673`); it never draws an object in a room. So `printer_host` and `lobby_camera` keep their sprites and there is no second printer.

**P8 (V8 budget).** Validator line: frustration 1/6; heard_ globals 1/8; magnet servings 1/2; dropped magnet items 1/2; office-life items 1/4; small keys 3/64. No V8 warning. onceOnly mappings in the scenario file: 4 (Ama: office greeting, plug-in bark, unplug bark, printer-off bark), under 10.

## Where the plan was wrong or unclear

1. **Realism links (5.3, 5.4 R6) cannot be done.** `scripts/validate_realism_skin.rb:509-511` errors unless every finding (decoys included) links a catalog entry, and each entry is linked once (`:494-499`). The catalog has only three entries (`filehold_*`) and the scenario has six findings. The file server therefore has no `realism` fields, and `cli.banner` is set on all three finding-holding services (the banner rule is also all or none, `:485-491`). R6 still shows the Terminal with the authored banners, but not catalog text. To get realism text back, three more catalog entries (human review) or a design with only the three file-server findings are needed.
2. **Four PCs on a sweep need sign-in PCs.** Only sign-in objects are host rows (docs N12). So `chidi_pc`, `jun_pc`, `graham_pc`, `agnieszka_pc` are login PCs (`lockType: login`, owner, creds on each NPC, `"affordance": {satisfies work}`), not office-life workstations. Chidi and Jun lose the `habits.screen` and open-screen behaviour of the showcase; the caught-at-the-desk bark still works. Their passwords live only in `creds`. Graham is `creds.admin: true`, role `it`.
3. **Graham's PC and the log PC are in `it_room`**, with Graham (the plan's 5.1 table has them there; the validator warns if the owner is elsewhere).
4. **Zainab and Graham are in rooms other than the start room.** Their `act_evening` and `act_midday` mappings are `fireOnlyWhenLoaded`, with a relay that also sets their need when the player enters their room with the act already on (`room_entered:server_room`, `room_entered:it_room`). Result: Zainab walks to the kitchen coffee after the player next enters the server room in the evening, not at the moment of "Call it a day". Her card hand-over is gated only on `act_evening`, so it also works in the server room. `act_evening` on Ama switches the office coffee off so the kitchen machine (the only one on) is where she goes.
5. **`use_card` ticks on `network_technique_used:printer_host.admin_page.factory_login`**, not the bare event, so a card used first on the file server cannot tick it early. Agnieszka's trips to the printer are not authored beyond her work need on `printer_res` (the printer resource's `offWhen printer_off` gives her `work_fail_printer` mutter); no photocopier output slots are used.
6. Positions of new objects (hot-desk jack at 3.5, 6.4; printer 8.3, 3.0; cupboard 8, 5.2; kitchen jack 8, 2.4; tool roll 7, 4.2; log PC 6.2, 2.8; file server 3, 4) are untested in a render. The jack's 1.5-tile distance from Jun's approach cell must be checked in the browser.
7. The log source lists events by name (`net_link_up`, `net_link_down`, `share_folder_opened`, ...), not `net_*`, to avoid the wildcard warning. Seed rows s1 to s3 (07:10 to 07:14) name the kitchen jack; s2 (07:12) is the anomaly.
8. The realism catalog index says a content digest freezes once a non-test scenario links an id; nothing is linked now.

## Warnings left (all intended or copied from the showcase)

- 3 from R-I ink (not this unit): `ama_owusu.ink` lines 45 and 134 name "Terminal" beside "check"; `zainab_hussain.ink` line 50 has `#give_item` after a line (tag should come before the line).
- Office-life "target is in another room" notes for each NPC (copied kitchen block, as `office_life_showcase`).
- Generic suggestion lines (VM launcher, flag station and so on): not relevant to a demo.
- Seed-row jack names are not checked by the validator (`scripts/validate_log_rows.rb:400-405`); checked by hand: `kitchen_jack` exists, `printer_host` exists, `office_lan` exists.

## Not done by this unit

`dungeon_graph.*` (unit R-T), `PLAYTEST.md`, `VOICED_LINES.md`, the Rails test.

## Wave 2 (unit R-T)

Validator `ruby scripts/validate_scenario.rb scenarios/demo_ops_recon/scenario.json.erb`: 0 errors, 23 warnings (down from 26: the three ink warnings are cleared). The remaining warnings are the office-life "target is in another room" notes for the copied kitchen block (as `office_life_showcase`), the generic suggestions (VM launcher, flag station, lock variety and so on, not relevant to a demo), and the "puzzle_graph_unlocks" suggestion. Dialoguelint (node 22): 0 ERROR lines. The ink compiler prints its usual "END detected" convention note for each file.

Integration changes: `ama_owusu.ink` knot `terminal_check` renamed `terminal_talk` (the knot name paired "terminal" with "check" and tripped the realism wording warning); `zainab_hussain.ink` `card_offer` puts `#give_item:technique_card` before the dialogue (the held card is the only NPC-held `technique_card`, so the type alone picks it, `games_controller.rb` `find_npc_holding_item`).

Scenario change found by the leak scanner: the plan's mappings for `confirm_both` and `use_card` named finding ids in `eventPattern` (`network_finding_confirmed:printer_host.admin_page.factory_login`), which ship with the office room's NPC data before any check; the scanner (rule `ops_string`) reports them. They now listen to the bare events and read the payload (`data.findingId.includes('printer_host.')`, `data.status`, `data.grant === 'credential'`). The four `confirm_both` mappings keep their shape (two setting a global, two completing the task on the second confirm, either order).

Leak scan: the whole played run (every answer of the real routes, plug to unplug and the log read) gives zero findings with nothing filtered.
