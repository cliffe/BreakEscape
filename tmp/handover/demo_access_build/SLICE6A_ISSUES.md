# Slice 6A issues: causes and fixes

Branch build/demo-access-tour. Commits: 5c94b1b75, 0c9ee3184, a6ee4bd87, 5e5263f1a, 26d191023, plus this note. Own keyless server on :3097. Game 7537 on :3096 untouched.

## 1. nil-id inventory entries (phone, Notepad): engine-wide, no change
- Phone: game.rb:7422-7440 copies each startItemsInInventory hash as-is into player_state['inventory']. The phone block has no "id" in any scenario (m01_first_contact has the same block, scenario.json.erb:514-522).
- Notepad: built client-side (inventory.js notepadItemData, objectId notepad_inventory, no id) and synced up. games_controller.rb:3165 ALWAYS_ALLOWED_ITEMS and game.rb:847 treat notepad as never a key. ItemIdentity.client_forged? (network_access.rb:160,459; credential_keyring.rb:52) deliberately treats id-less client items as non-keys.
- Evidence, fresh games: demo_access_tour 7549 [nil phone], [cake cake1]; m01_first_contact 7550 [nil phone]; office_life_showcase 7548 [cake cake1], [nil notepad].
- Decision: left alone. Adding ids would change key and credential matching for every mission. The nil id is the intended "client-built, not a key" marker.

## 2. Thandiwe's laptop, one click: engine overlap rule, explained
- Reproduced on fresh game 7549, walking in legitimately (open plan is unlocked). First click: overlap walk, then toast "Someone's in the way." (game.js:3151-3158). Second click in range: pick-one menu chose the laptop, answer "Thandiwe Moyo is using this PC." (unlock-system.js interactLoginPc step 1, intended while she is seated). Yasmin's PC behaves the same.
- Cause: laptop and PC sprites overlap the desk and the seated NPC (aim reports sharedWith desk_thandiwe / desk_yasmin), so the engine's disambiguation walk and menu run first. The validator already warns (15 px and 12 px). With Thandiwe away the laptop opens straight to the desktop (slice 4 evidence).
- Fix: none in scenario data; the overlap is the intended look (elevation 30). Proposal: make laptop and PC desk tableItems, or accept the second click. The "Someone's in the way" wording on a reachable target is an engine oddity (game.js:3151).

## 3. Tray icons: fixed
- Cause: kit_injector and demo_stick both used usb_bowl1 (13x8 white bowl art that reads as a router).
- Fix: kit_injector now uses icon_deviceB (red stick, the BadUSB art lab_physical_pentest already uses). demo_stick keeps usb_bowl1. No new art.
- Evidence: tray screenshot on game 7556 (red stick next to the card). Sprite sits on the meeting table row (table 113-168, sprite 136-164).

## 4. Rogue AP LED: added
- lighting.js supports it as a room emitter. Added top-level lighting {enabled true, defaultMode on} and a reception emitter for planted_rogue_ap (blue blinking dot, offsets -4,3, copied from lab_physical_pentest, same rogue_ap_tucked overlay).
- Side effect: the scenario had no lighting; enabling it adds small glows on emitters (exit sign, fire alarm). Room otherwise looks the same (game 7556 screenshot).
- Not seen live: needs the AP hidden in a plant and set up, not driven here. Config only, validator clean.

## 5. Visitor card and the reception pin-distance warnings
- Finding: card (stock 16x10 keycard) at x 6.4 overhung the counter's right end (counter spans x 105-215) and was partly hidden by Delphine. Five props on a 110 px counter cannot all be 32 px apart, hence 11 to 15 warnings.
- Fix: card and Wi-Fi sign moved to the reception sign-in table (zds_desk1): card x1.3 y6.3, sign x2.5 y5.95, both elevation 30 (without it they drew under the table). USB hub nudged to x4.4. All square to the walls.
- Result: validator 0 errors, 10 warnings (the four reception pin warnings cleared; one under the 11 baseline, so one baseline warning was in this cluster). Screenshots games 7559/7560 show the card readable on the table. To put the card back on the counter, accept 3 to 4 pin warnings.

## Tests
- demo_access_tour_devices_test, _tasks_test, _test under flock tests.lock: 77 runs, 1112 assertions, 0 failures. node --test test/js/validator-access-work.test.mjs: 38 pass.
- Validator run with --no-graph; dungeon_graph.* left unstaged.
