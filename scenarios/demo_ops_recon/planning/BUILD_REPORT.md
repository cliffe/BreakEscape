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

## Round 1 fixes

Sources: `planning/IMPL_REVIEW_R1.md`, `planning/DIALOGUE_REVIEW_R1.md`, the recon playtest (`/data/tmp/scratch/showcase-recon-playtest/`: Jun never caught the player in four minutes, Zainab never left for the kitchen, Ama's barks not seen). The root of the first two: an NPC's needs only pick targets in rooms the player has loaded, and `fireOnlyWhenLoaded` mappings do nothing for an unloaded room. In the playtest the kitchen was never opened (the unlocked rooms were office, server_room, it_room), so with the office coffee off there was no coffee for Zainab to walk to. The fix follows `office_life_showcase`, which gates its lunch on `kitchen_seen`.

Live check (keyless server on :3022, fresh game 196, stopped after): Ama refused "Call it a day" before the rooms were seen; after entering the kitchen and the server room once, "Call it a day" sent Zainab to the kitchen coffee at once (`npc_left_post:zainab_hussain` target `kitchen_coffee`, then `npc_use_started:kitchen_coffee`) without re-entering the server room. With the player at the hot desk port when Jun came back from coffee, `npc_returned_post:jun_watanabe` came with `playerDistance` 35 and the new catch mapping fired. After a sweep, Ama's conversation history held the plug-in bark and the new sweep bark.

| Finding | Outcome |
|---|---|
| Impl M1 (evening: Zainab never reaches the kitchen) | Fixed. Ama's "Call it a day" waits until `kitchen_seen` and `server_room_seen` (new global, set on `room_entered:server_room`) and says where to look first. With both rooms loaded her `fireOnlyWhenLoaded` evening mappings fire, and she goes to the kitchen coffee (checked live). Ama's day-end line now says Zainab "will head for the kitchen coffee"; "What's next?" says she is in the server room or at the kitchen coffee; the notice board says "server room, then the kitchen coffee". The server-room relay mapping stays. |
| Playtest: lunch does nothing without the kitchen | Fixed the same way: "Send them to lunch" waits for `kitchen_seen` (food is only in the kitchen). |
| Impl M2 (realism text promised, not built) | Accepted (owner decision): realism text is shown by `test_ops_skin`. `mission.json` no longer says "with realism text"; no ink line says the Terminal shows catalog text or a false reason (dialogue M1); no catalog entries added. The plan's section 1 table is outside this unit's files: the orchestrator should add the note there. |
| Impl M3 / playtest (Jun never catches the player) | Fixed. Measured live: Jun's home point is (92, 164) px; at the old port (3.5, 6.4) the player stood about 90 px away, and a player can use the port from about 1.5 tiles, so the engine's 48 px caught check could not see them. The port moved beside the desk to (3.0, 5.9) (player at the port: about 62 px from the home point, 35 px from Jun as he sits). Jun gained two mappings at the end of his list: `npc_returned_post:jun_watanabe` with `data.playerDistance <= 80` barks the same line, and `npc_left_post:jun_watanabe` clears `jun_caught`, which the caught mapping sets, so one return gives one bark. The validator's V3b check found that the returned mapping first also set `jun_caught` (its own condition); removed. |
| Dialogue M1 (Terminal teaching untrue) | Fixed: choice "It listed the same findings, with addresses."; lines about addresses and banners. |
| Dialogue M2 (Graham's hint points at the wrong row) | Fixed: "Before you got here, someone swept the whole network from the kitchen port. Find that sweep and flag it." The log PC observation no longer says a row is already marked. |
| Dialogue M3 (Graham's offer in the player's mouth) | Fixed: the choice is "Ama said you'd show me the network log." and Graham asks "Want to see what you looked like from here?". Gated `act_evening and not read_log_done` (m12). |
| Dialogue M4 ("socket" sends the player to power sockets) | Fixed: every ink line and the notice board say "network port"; the jack is named "Hot desk network port"; the two power levers are "Printer wall socket" and "Coffee wall socket" with observations (impl m7); the jack prompts say "network port". |
| Dialogue M5 (stale coffee line) | Fixed: one line that holds in every state. |
| Dialogue M6 / impl m2 (Terminal tick offered at once) | Fixed: offered only after the file server has been scanned (`file_server_seen`, set by `network_host_scanned:file_server`; a host id, not a finding id), with a way back out ("Actually, I haven't yet."). |
| Dialogue M7 (nobody points at the saved link) | Fixed: a bark when `use_card_done` turns true ("The printer kept a saved link to Agnieszka's PC. Try it from her row."), and the recap line says what the card did. |
| Dialogue M8 / playtest (too few barks; barks not seen) | Fixed: barks on the sweep, the printer scan, both confirms, the card, the file server scan and the shared drive, and on plugging in at the kitchen. They are on `global_variable_changed:<task>_done` with `data.oldValue !== true` (a mapping's `setGlobal` emits on every write, so this fires once) and a condition that the next step is not yet done, so a bark held behind the network view is dropped as stale if the player has moved on. Barks are held while the view is open and show when it closes; PLAYTEST says so. Ama's onceOnly count is 5 (was 4). |
| Impl m1 (kitchen jack leaves "What's next?" stuck) | Fixed: `network_foothold_gained:kitchen_jack` ticks `plug_in` and sets `plug_in_done`, with a bark. I tick the task too (the review said no tick): the task is "where nobody will notice", which the empty kitchen satisfies, and an unticked first task would sit open for the whole day. |
| Impl m3 (weak test assertions) | Fixed: `where.kind` is unconditional; the invented finding asserts a 404; the switched-off printer scan asserts the exact status and reason; the test name matches the body. |
| Impl m4 (leak run skips refusals) | Fixed: the recorded run now has the kitchen plug and unplug, the printer-off sweep and scan, `not_confirmed`, `wrong_class`, `need_unmet` and the three refused shared-drive answers. |
| Impl m5 (two untested refusals) | Fixed: card 3 refused on `release_line` and on the camera decoy; Zainab as source of a card she does not hold is refused. |
| Impl m6 (Agnieszka's printer trips) | Dropped from PLAYTEST (allowed by the review): she has no print habit (that needs output slots and an `onUse` hook) and R3 does not need it. The plan's R3 "opening" is therefore not shown. |
| Impl m7 (Graham screen-lock line; missing observations) | Fixed: the line is cut; both power sockets have observations. |
| Dialogue m1, m2 | Fixed with M1 above and the new "What's next?" evening lines (user session, then admin, then the card from the tool roll). |
| Dialogue m3 (screen-lock lines) | Fixed: Chidi's topic is "Is the network slow for you too?" ("Only since about seven..."), which points at the 07:10 seed rows. |
| Dialogue m4, m8, m9, m10, m11 | Fixed as suggested (Jun's tell, Agnieszka's start line plus a line that her PC set up the printer, Zainab's question, Ama introduces herself, "some need a user session first"). Zainab also says the second card is in her tool roll. |
| Dialogue m5 (repeated greeting) | Fixed: the hub greeting cycles "What can I help with?", "Anything else?", "Go on.". |
| Dialogue m6 (recap monologue) | Fixed: "What did that show?" asks which part (morning, midday, evening). |
| Dialogue m7 (lunch line) | Fixed: "Lunch, then. Staff drift off their desks, Jun included." |
| Cupboard placement (impl M3 note) | Checked in a render: the cupboard is below the printer, on the right, not by Agnieszka's desk; Ama's line and the cupboard observation now say "printer cupboard" and "just below the printer". The tool roll (7, 4.2) was not rendered this round. |

Not changed: the `work_fail_printer` chatter pool stays as built. An off resource makes her grumble from `station_fail` (`npc-needs.js` `_failTopic`), which this scenario does not define, so she falls back to `work_fail`; a `station_fail` pool with the printer lines made the validator warn (V7, the same lines twice). PLAYTEST no longer promises a printer line.

Checks: ink compiles (6 of 6); validator 0 errors, 24 warnings (the 23 listed in wave 2 plus one realism-wording warning on the ink condition line `{ confirm_both_done or use_card_done or terminal_view_done }`, a false positive from variable names); dialoguelint 0 ERROR; `tools/check_mapping_index_drift.rb main`: 0 failures (new scenario skipped).
Rails test `test/controllers/break_escape/demo_ops_recon_scenario_test.rb`: 19 runs, 282 assertions, 0 failures; the whole-run leak scan (now with the refusals, kitchen plug and printer-off answers) reports 0 findings. The switched-off printer scan answers 403 `not_responding`. `bin/ops-golden-compare`: 27 runs, 0 failures. Dungeon graph regenerated.

## Round 2 fixes

Inputs: `IMPL_REVIEW_R2.md` (six minors) and the run 2 playtest (16 differences).

| Finding | Outcome |
|---|---|
| n1 (reload leaves the room-seen flags set, only the start room loads) | Fixed in the scenario: a `game_loaded` mapping on Ama clears `kitchen_seen` and `server_room_seen`, so after a resume lunch and "Call it a day" wait for the player to walk into the rooms again, and Ama says where to look. The engine cannot load rooms on resume. PLAYTEST A6 and R7a state this. Not checked in a browser. |
| n2 (Zainab leaves on every server room entry) | The relay now needs `zainab_card_given !== true`. (`onceOnly` was not used: fired onceOnly state is saved across a reload, which would stop the post-reload relay.) |
| n3 (Graham's lunch repeats) | The relay now needs `act_evening !== true`. |
| n4 (levers offered after the day ends) | "Send them for coffee" and "Send them to lunch" are gated on `not act_evening`. Lunch also says "They only go the once." (playtest: lunch vanished with no reason). |
| n5 (file server bark ignores the Terminal) | "That's the file server. Try it in the Terminal too, then tell me what it said." |
| n6 (loose test status) | Asserts 422. |
| Playtest 12 (Jun's bark four times) | Both Jun catch mappings now have a 90 s cooldown. |
| Playtest 6 ("Desktop is empty" reads as a bug) | Agnieszka's PC now holds `print-queue.txt`. Not seen in a browser yet. |
| Playtest 9 (no printer-off bark seen) | Not reproduced from the mapping (it matches the others that fire). PLAYTEST says the toast is the sure feedback and asks the next run to report the bark. Open. |
| Playtest 10 (Zainab slow) | Same cause as n1. |
| Playtest 11, 13 (no refusal line, first recap line missing) | A story run of `ama_owusu.json` emits the refusal and every recap line, so the ink is right; the run 2 read-out missed the first line after a choice. PLAYTEST says to read the lines on screen. Open: a client or harness read-out question. |
| Playtest 1 to 5, 7, 8, 14, 15 | Engine or harness behaviour, not scenario faults. PLAYTEST now has the exact on-screen text (eight tasks in three aims, the board names controls, eight sweep rows, no grant text on confirm, toast wording, share opens from the file server desktop, Unplug only at the port, "Agent 0x00", the filter). |

Scenario test in the scanner batch: the cause was not reproduced (the batch passed on three seeds, 59569, 1, 2, before and after). The shared state found is the request-scoped store `OpsLog::Current.issued_secrets` (left set by the MFA tests, which make the log guard refuse a row that equals an issued secret) and a frozen clock from `travel_to`. The recon test now clears both, and the ops log overlay, in `setup` and `teardown`. Proof run: `access_leak_scanner*_test.rb` plus the recon test, seeds 1 and 2: 166 runs, 3386 assertions, 0 failures. The leak scan reports 0.

Checks: ink compiles (6 of 6); validator 0 errors, 24 warnings (unchanged); dialoguelint no findings; `tools/check_mapping_index_drift.rb main`: 0 failures; `bin/ops-golden-compare`: 27 runs, 0 failures; dungeon graph regenerated.

## Showcase tour U1 (2026-11-25)

Plan: `docs/agents/ops_core_build/SHOWCASE_TOUR_PLAN.md` 2.3, with review R4. Owner's answers of 2026-11-25 (section 5 of the plan, recorded there as decided by R4): yes to `demo_ops_terminal` and the freeze; mission rows may be re-seeded in dev (standalone and Hacktivity's seed both fine); yes to the voice spend after the dialogue sign-off; yes to the helpdesk call as the last unit.

### Probe answers
| Probe | Answer |
|---|---|
| `via` on the Agnieszka PC sign-in from the saved connection | `credential` (`pc-sessions.js:835`); the event is `pc_signed_in:agnieszka_pc` (the suffix is the pcId, `:371`). Live: ticked `remote_signin` and barked. |
| technique session `via` and `npcId` on the file server | `via` `technique` (`pc-sessions.js:753`), pcId is the host id `file_server`; `npcId` is the grant's account, `agnieszka_duda` then `graham_whitfield` (scenario grants). Not clicked live this round (evening beats); read from code. |
| Does `endedPcIds` list every PC the "ended every session" line claims | Yes: new Rails test `tour R8c probe` shows an unplug after the saved-connection login and the update-gap session ends exactly `agnieszka_pc` and `file_server`. |
| Does an unplug before the share neither tick nor spend the once-only bark | A failed condition does not spend a once-only mapping (R3 review, `npc-manager.js:1561-1592`); the new mapping carries `globalVars.open_share_done === true`. Not clicked live. |
| Jun and the hot desk window, Zainab's trip lengths | Unchanged: no routine number was touched, so not re-measured. |

### Changes
New tasks `remote_signin` (midday, between `use_card` and `terminal_view`) and `unplug` (evening, last), with globals `remote_signin_done`, `unplug_done`, `box_at_kitchen` declared in the scenario and as ink VARs; the new mappings are appended (indices 28 onward), the changed barks (R1 to R5, `open_share`, unplug) are changed in place; the existing unplug mapping gains the condition, task and global. Appended: kitchen unplug, the two `box_at_kitchen` trackers, `remote_signin`, its bark, the two technique-session barks, the log bark, the false-card pointer. Ama's ink: "What's next?" lines for R1 (Jun), R3b, R5c and R8c (inline `{box_at_kitchen: kitchen|hot desk}`), the "Call it a day" gate (one fixed line per undone beat, `lever_day_refused`), the R6 and R6c lines in `terminal_ticked`, recap lines. The board lists the new beats. Voice styles of Chidi, Jun, Agnieszka and Graham now name Merrin & Sallow (voice names, ages and accents kept); `ttsPregenerateChatter` is set. No audio generated. New voiced lines are listed in `VOICED_LINES.md` under "Tour round".

### Checks
Ink compiles (6 of 6); validator 0 errors, 26 warnings (the 24 listed before plus two objective-wiring warnings: the appended `box_at_kitchen` mappings share `network_foothold_gained:hotdesk_jack` and `:kitchen_jack` with the `onceOnly` plug-in mappings, which is intended: the plug-in tick fires once, the position tracker every time); dialoguelint 0 ERROR; mapping drift 0 failures; tagdiff changes explained above; Rails test 24 runs, 0 failures, leak scan 0; `bin/ops-golden-compare` 45 runs, 0 failures; graph regenerated.

### Where the plan was wrong
- 2.3 says the R6 line is in the "typed" register; the validator's realism-wording check flags "typed" beside "scan", so the line says "printed the way a console prints them".
- The plan's gate says "the list of undone beats"; a single line cannot hold seven optional fragments without many voiced variants, so each undone beat is its own fixed line.
- The two wiring warnings above are unavoidable with the plan's appended position mappings.
- `plug_in` still ticks on the first plug-in only; `box_at_kitchen` is what tracks later moves, as planned.
