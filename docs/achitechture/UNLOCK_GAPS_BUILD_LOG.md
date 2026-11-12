# Unlock gaps build log (2026-11-12)

Branch `build/unlock-gaps`, from main at 6a834437c. Two latent server gaps from docs/IDEAS_BACKLOG.md, both now marked fixed there.

## Gap 1: combination padlocks and cryptexes

`Game#validate_unlock` had no `combination` or `cryptex` branch, and neither lock type was in `UNLOCK_METHODS_BY_LOCK_TYPE`, so both were refused before any check (422, shown as a wrong answer).

What changed:

- `UNLOCK_METHODS_BY_LOCK_TYPE` takes `combination` and `cryptex`, each opened only by its own method.
- New `Game.lock_answer_matches?(lock_type, secret, attempt)`, used by the door and object branches. The secret is the lock's `requires`.
  - Combination: compared as integer sequences, so `"12-30-5"` from the dials matches `requires` written `"12-30-05"`, `"12 30 5"` or `[12, 30, 5]`. Anything that is not all digits fails.
  - Cryptex: compared ignoring case and outer spaces. The wheels show fixed letters, so case can only differ through an authoring slip.
  - A blank or missing secret or answer never opens.
- PIN and password do no normalising (exact `to_s` compare). The combination and cryptex rules above differ on purpose, for the reasons given.
- `Game.strip_lock_answers!` removes the old client copies of the answer (`combination` on a combination lock, `cryptexConfig.answer`) in both payload filters (`filter_requires_and_contents_recursive` and the controller's `filter_requires_recursive`). `requires` was already stripped for both lock types.
- Client: both minigames used to read the answer to drive the UI (the padlock moved to the next dial only at the right number, and the cryptex enabled Submit only when the word matched). Neither holds the answer now:
  - combination: turning the next dial in its direction sets the current one. Unlock is enabled from the moment the last dial is reached, so 0 can be tried there. A wrong direction on the current dial still resets.
  - cryptex: Submit is enabled after any wheel turn, so any word can be tried.
  - `startCombinationMinigame(lockable, type, callback)` no longer takes a combination, and `unlock-system.js` no longer reads one.
- Schema: both `lockType` enums (room and object) take `combination` and `cryptex`. `cryptexConfig` is a known object field.
- Validator: new `check_combination_cryptex_locks` adds three checks.
  - Errors: no `requires` (naming the old field if the answer is still there); a combination that is not three numbers from 0 to 39; a cryptex word whose length differs from `wheelCount` (5 if unset); a letter that is not on its wheel.
  - Warns: an answer left in `combination` or `cryptexConfig.answer`.

## Gap 2: a container an NPC carries

Once a give or a knock-out released a container from an NPC, opening it called /unlock. `find_scenario_object` never looked at NPC-held items, so the player saw "Access denied".

What changed:

- `Game#released_npc_containers` returns the scenario copy of each container held by an NPC (room NPCs and headless email records) when:
  - the item has an `id` and has `contents`, is locked, or is a container type (`suitcase`, `briefcase`, `bag1`, `bin1`, the types interactions.js opens as containers);
  - it is not a USB habit stick, since those have their own path;
  - a server record releases it: the give record (`npc_given_items`, written only after a validated give) addresses it, or the NPC's KO is recorded (`npc_defeated?`, which needs a KO-claimable NPC the player has met).
- The dropped copy in `objects_added` and the inventory copy are never read for this, so the browser cannot invent a container or fields on one.
- Wired into `Game#find_scenario_object` (validate_unlock, PIN cracker feedback, case hint) and into the controller's `find_object_in_scenario` (the /unlock response contents) and `find_container_in_scenario` (GET /container). It also goes into `find_accessible_item`, so an item inside such a container can be taken. That take is a `container` location, so the container must be in `unlockedObjects` first.
- The container's own lock is checked as for any object (lockType and method must match, then the answer).
- Size: no player state is added. The lookup walks the scenario's NPC-held items per call (bounded by the scenario) and is not memoised, since the records change per request.

## Tests

All run without the lock, as the test lock rule asks (affected files only):

- New `test/controllers/break_escape/combination_cryptex_unlock_test.rb`: 11 runs, 60 assertions, 0 failures. Covers right, wrong and missing answers for an object padlock, a cryptex and a combination door; method mismatch; neither answer in the room or scenario payload; the normalisation rules.
- New `test/controllers/break_escape/npc_container_unlock_test.rb`: 7 runs, 43 assertions, 0 failures. Covers:
  - a KO-dropped locked bag: wrong then right password, GET /container, taking its memo;
  - a given folder: refused before the give, opened after, contents taken;
  - a give of one container not releasing the other;
  - a container still held being refused even with the right password;
  - forged records (a client-added inventory copy, a give record from an NPC not in the scenario) and an invented id being refused;
  - a KO releasing only that NPC's items.
  With `released_npc_containers` forced to `[]`, the three positive tests fail, which confirms they test the fix.
- Affected Rails files: game_test, games_controller_test, usb_habit_test, friendface_phone_test, forged_ko_drop_test, npc_give_test, headless_give_test, unlock_response_filter_test, declared_grants_test, access_model_desktop_test, add_object_key_forge_test, reload_persistence_test and scenario_npc_records_test, plus the two new files. 375 runs, 1588 assertions, 0 failures. Also ink_compiled_staleness_test and tts_mission_lines_test, which enumerate scenarios: 7 runs, 0 failures.
- JS: every test/js file that imports unlock-system.js, minigame-starters.js or either minigame (37 files): 377 tests, 0 failures. Two new files:
  - `test/js/combination-cryptex-no-answer.test.mjs` (4 tests): no answer is kept, any value can be submitted, and the exact strings sent;
  - `test/js/validator-combination-cryptex.test.mjs` (4 tests), run with validator-pin-locks: 9 tests, 0 failures.
- Validator: `scenarios/test_unlock_gaps/scenario.json.erb` gives 0 ❌ lines. A deliberately broken copy (`12-30-45`, a 7-letter word on 6 wheels) gives the two expected ❌ lines. m01 still gives 0 ❌.

## Live proof

Not done. No Mission row exists for `test_unlock_gaps`, and making one means seeding the shared dev database. The Rails tests drive the real endpoints (room load, KO drop through update_room, give through inventory, /unlock, GET /container). The JS tests check what each minigame sends. The new scenario lists the manual steps in its brief for a browser check once it is seeded.

## Left open

- The combination padlock's 40 positions and its L-R-L order are fixed in the minigame. A three-number `requires` is all the validator allows.
- After a wrong combination the dials stay where they were and Unlock re-enables on the next turn of dial 3. This is unchanged: `_handleReset` returns early while a submit is in flight.
- The dungeon graph generator was not taught the two lock types (the graph was not run, as `--no-graph` was used).

## R1 fixes (2026-11-12, branch build/unlock-gaps-r1)

From docs/achitechture/UNLOCK_GAPS_CODE_REVIEW_R1.md, plus the screenshot pass (shots 15 to 29) and the pixel-art UI rule.

Review findings:

- **M1, padlock.** The left/right/left rule is gone; it no longer played well without the auto-stop. Either arrow turns the current dial, so an overshoot is one click back. Turning the next dial sets the current one and also turns the new dial one number, so the first click shows. Holding an arrow spins (after 380 ms, then faster). Reset puts the dials at 00 and then says so. The current dial glows amber with "TURN" on its label; set dials are green with "SET".
- **M2, cryptex doors.** Chosen: ship the config. `cryptexConfig` is in the bootstrap room fields (game.rb, answer stripped there and again by the controller filter), in `doorProperties` (doors.js), read by unlock-system.js for a door, in the room schema and in the validator's known room fields. test_unlock_gaps has a 4-wheel cryptex door (Archive, north of the Vault). README row updated.
- **m1.** The `requires` array schema takes integers too, as the server does (`[12, 30, 5]`). README says both forms.
- **m2.** New validator check `check_npc_held_containers`: an `itemsHeld` item with contents, `locked: true` or a container type and no `id` is a ❌.
- **m3.** `GamesController#client_inventory` serves a filtered deep copy for `playerInventory` and the three inventory replies; player_state keeps the full copy. No sync size change (a copy per response, nothing stored).
- **m4.** A wrong combination says what was tried, how many tries are left, and that the dials are back at 00 (set after the reset).
- **n1** graph labels added. **n2** wheelCount read with `Integer(..., exception: false)`, nonsense is a ❌. **n4** the first click on the next dial plays the click and turns it. **n5** Submit starts enabled. **n3** (no server attempt limit) and **n6** (builder-rule line) left as logged.

Screenshot pass:

1. **Cancel covering footers.** Root cause: `.minigame-controls` in minigames-framework.css was absolutely placed at the bottom of the screen, over any footer a minigame draws (padlock, cryptex, container Take). It is now in the window's normal column under the game area, as examine, the forensic platform and the fingerprint reader had each already done. This changes every minigame that shows Cancel (about 30): their game area is about 70 px shorter. Not yet checked by screenshot on other minigames.
2. **Padlock feedback.** A help line under the title says how the dials work; the header says which dial to set; wrong tries reset all dials (no green left); success marks every dial set, the header reads "Open" and the button "Open".
3. **Cryptex feedback.** Down arrow now steps back (B to A), up forward. After a wrong word Submit waits for a turn and the message says "Turn a wheel to try another word". Success turns the wheels green and the subtitle reads "Open".
4. **The bag.** KO drops land on walkable floor round the body, at least 32 px from it and from each other, clear of shown furniture where possible (`koDropSpots` in npc-hostile.js; closes the backlog "KO item drops land on top of each other" entry once proven live). A bag, briefcase or suitcase password lock gets a brass case-lock look, not the PC wallpaper (`isCaseLockTarget`). Container items have a name label under each slot.

Pixel-art rule: in the padlock, cryptex, container standard view and case lock, Courier New became VT323/GNF, headings use `--ui-heading-font`, 1px borders became 2px, the glows became 2px outlines. Not touched: the container's desktop (monitor bezel) mode, which still has a gradient, radius and soft shadow.

Tests (affected files only, no lock):
- Rails: 441 runs, 2746 assertions, 0 failures (the build log's affected list plus filtered_scenario, network_implants, lab_physical_pentest_secrets); the inventory-reply files, 158 runs, 0 failures. The two new tests (cryptex door, start inventory) fail with the fixes reverted.
- JS: 107 files that import a changed module, 1356 tests; 0 failures after the follow-up commit. event-mapping-unlock-door.test.mjs reports a runner "Unable to deserialize cloned data" error under `node --test`, but all 5 of its tests pass when run directly; its emoji console output breaks the runner protocol, not this change.
- Validator on test_unlock_gaps: 0 ❌.

### Handover (stopped at the call limit)

Done: everything above, commits d043ab9a1 and 1d5a506d2, plus this log.

Open:
- **Live proof** (not started): swap test_unlock_gaps onto a test_seating game with `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_seating test_unlock_gaps`, keyless server on a port of 3095 or higher started by hand as start-keyless-server.sh does, session-start.sh --headless, setFPS(20), fixed steps on. Prove: padlock opens through the UI with an overshoot recovered by a back-step; a wrong answer shows its message; the Archive cryptex door shows 4 wheels and opens with KEYS; KO drop visible and clear of the desk.
- **Screenshots** before/after into scratchpad ux-shots/branch/after_unlock/ with manifest.json, and two or three other minigames with a Cancel row (PIN pad, notes, alarm panel) to check the framework change. Check each against the pixel-art rule.
- Stop the server afterwards.

Gotchas: the framework Cancel change affects every minigame; if one looks wrong, give it a local rule as examine does rather than reverting. notes.css has a narrow-screen rule that assumed the absolute Cancel.

## Live proof and minigame sweep (2026-11-12)

Keyless headless servers: main 13a0f9f96 on :3099, this branch on :3100, 1400x1000, setFPS(20) with fixed steps on. Games made with swap-scenario-game.rb on test_seating: 1764 (branch proof), 1768 and 1769 (sweep, main and branch), 1798 and 1803 (main "before" shots; 1803 starts in the Vault). Shots and manifest.json: scratchpad ux-shots/branch/after_unlock/ (NN_name_before.png / NN_name_after.png).

Live proof on the branch, all through the UI (button clicks in the page, padlock hold by pointer events):
- Padlock (Locker): dial 1 to 13, one back-step to 12, dial 2 to 30, dial 3 to 05, Unlock: opens, header and button read "Open". Holding the dial 1 right arrow for 1.5 s spun it 00 to 11; the release click was ignored.
- Wrong answer 01-01-01: "01-01-01 did not open it. 2 attempts left. Dials back at 00: set dial 1 again." Dials at 00, none green.
- Cryptex down arrow: A, up B, down A, down Z. CIPHER opened the cryptex box. On main the down arrow went A to B.
- Archive door: Vault padlock 07-21-39 opened in the UI, then the Archive door showed 4 wheels and KEYS opened it; the player walked in. Main shows 5 wheels.
- KO drop: the Courier Bag is visible 47 px from the body (main: 8 px). It opens with the case-lock look; Satchel42 opens it and the item has its label.
- Server state for 1764: unlockedRooms lobby, vault, archive; unlockedObjects locker, cryptex box, courier bag.

Minigame sweep: 59 registered scenes started directly with MinigameFramework.startMinigame; 33 draw the framework Cancel row (coverage-decision-form hides it and draws its own Close). Each was screenshotted on main and the branch and checked for a hidden or off-screen Cancel (hit test at three points), spill below the game area, double footers, new scrollbars and page scroll. Short screens (915x412 and 800x600) were checked for nine of them, including notes.

Regressions found and fixed (commit 36f0c92b0, test/js/minigame-controls-layout.test.mjs, 5 tests, all fail on the unfixed CSS):
- SIEM dashboard, EHR terminal and network architecture: Close pushed off the bottom, header cut at the top. Backup recovery: Close hidden under the console shell. These four full-window consoles keep the old overlay placement (they reserve a bar for it).
- Long text file: Close off the screen. `.minigame-game-container` now has `min-height: 0`, so the game area shrinks and the text scrolls above Close. Side effect: SIEM and network architecture game areas are 40 px shorter than on main; the SIEM list shows half a row as a scroll cue.
- Password panel (and the case lock): ran 60 px past the game area and covered Cancel. Container: Take Container straddled the window edge. Both panels are now `calc(100% - 80px)` tall, which allows for their margin and padding.
- Notes on short landscape screens: the narrow rule assumed an absolute Cancel, so Continue fell under the notepad and the notepad title was cut. The rule now sets `position: absolute` again; matches main.
- `.minigame-controls` also gets `position: relative; z-index: 1`, so anything that still spills (biometrics field note, notes foot) is drawn under Cancel, not over it.

Left as is: at 915x412 the padlock, cryptex, PIN, password, container, SIEM and backup consoles are cramped on both main and the branch (Cancel over content on main, content past the frame on the branch). PIN and biometrics titles or notes spill on both. No double footers and no new page scrollbars.

Pixel-art rule (computed styles of visible elements, branch): every minigame inherits one soft shadow and two gradients from the framework shell (`.minigame-container` box-shadow, `.minigame-game-container` inset shadow). Beyond that, worst first: drug-library-integrity (174 1px borders, Courier New, radius), PIN pad (14 soft shadows, 14 gradients), scada-historian (16 hairlines, Courier New), biometrics, BLE and Bluetooth scanners (hairlines, soft shadows, radius), SIEM (13 hairlines), text-file (system UI font, shadows, gradients), forensic data platform and NCSC brief (Courier New), network architecture and infusion pump (generic monospace), notes (shadows, gradients). None fixed here.

## R2 fixes (2026-11-12, branch build/unlock-gaps-r1)

Review: `UNLOCK_GAPS_CODE_REVIEW_R2.md` (0 blockers, 3 majors, 4 minors, 6 nits). main 33c003230 merged first (387e6f14a, clean).

- **M1, KO drops through walls** (npc-hostile.js). New `koReachableCells`: a 4-way flood fill over the world grid from the body's cell (or the nearest walkable in-room cell within two cells), out to 128 px, keeping only cells where `roomIdAtFeet(x, y, rooms, 0)` is the room the NPC fell in. `koDropSpots` now takes `reachable` instead of `nearestWalkable` and only ever returns reached cells: clear ring spots, then clear reached cells further out, then hidden ring spots, then reached cells along a corridor at the full gap and half gap, then stacked on the nearest reached cells. With no grid at all the drops land on the body, 4 px apart. The blind fallback ring is gone. Found live: the first version tried hidden spots before clear floor further out, so two notes went under the right-hand desks (a desk top is drawn over walkable floor); the clear pass comes first now (7d1643416).
- **M2, `client_inventory` coverage.** `initialize_player_state` stores each start item as a `deep_dup` run through `filter_requires_and_contents_recursive`, as `canonical_inventory_item` does for picked-up items. New `Game#client_inventory` (deep copy; strips answers, the PIN, generator keys, grant contents and capture secrets; keeps contents); the controller's `client_inventory` calls it, and the seven network replies in network_access.rb use it, so games created before the change are filtered too.
  - Correction to the review: no server path unlocks a locked start item. `find_scenario_object` and `find_container_in_scenario` never search `startItemsInInventory`, before or after this change, so a padlocked case or cryptex in the start inventory cannot be opened at all. Not fixed here (no shipped scenario has one); it needs a lookup in those two finders limited to items the player holds.
  - **For the sync-deltas merge:** `item_for_answer` and the whole-inventory branch of `inventory_answer_fields` (on build/sync-deltas) read `player_state['inventory']` directly. Both must go through `Game#client_inventory` (or the same filter per item) when the branches meet. Keep `client_inventory` for `playerInventory` in GET /scenario.
- **M3 left alone, as briefed.** The build/ux-access merge turns `.container-minigame.desktop-mode` `height` into `auto`, and this branch's layout test still asserts `calc(100% - 40px)`. Whoever merges ux-access: keep `height: auto`, drop the calc line, and change the last assertion in test/js/minigame-controls-layout.test.mjs to "the desktop-mode rule sets no percentage height". Then take the two desktop-mode container shots the review asks for (1400x1000 and 915x412).
- **m1.** `.password-minigame-area.case-lock .password-field:focus { box-shadow: none; }`.
- **m2.** `MinigameScene` has `static controlsOverlay = false`; `init()` toggles a `minigame-controls-overlay` class on the container from it. The SIEM, EHR terminal, network architecture and backup recovery scenes set `static controlsOverlay = true`, and the CSS keys on the class, not on four container names. The examine, forensic data platform and fingerprint reader overrides are `position: relative` now, so the framework z-index holds. The forensic data platform controls row's 1px top border became 2px while there.
- **m3.** A hold on the next dial's arrow now spins it: its first tick sets the current dial and moves on, as a click does.
- **m4.** A request that never completes sets `networkError`; the padlock and the cryptex then show "Network error: <value> was not checked", keep the dials or wheels, count no attempt, leave `lastTried` alone and re-enable UNLOCK or Submit.
- **Nits.** Fixed: n1 (`.minigame-controls-overlay .minigame-game-container { min-height: auto; }`, so the overlay consoles keep their full height), n4 (a keydown on an arrow clears a stuck `_holdFired`), n5 (at spin speed the click sounds on every third turn). Logged, not done: n2 (Cancel row under the window frame rather than inside it), n3 (re-shoot the case lock after the ux-access merge, when the panel has both `prompt-mode` and `case-lock`), n6 (container label `text-shadow: 1px 1px 0 #000`; pick 2px or none with ux-access when the two meet). Also noticed and left: forensic-data-platform-minigame.css line 434 has another 1px border.

Sync size: no change to what `player_state` holds beyond start items being smaller (answers stripped). Each network reply sends the same inventory as before, filtered.

Tests (affected files only, no lock):
- Rails: 39 files (every network controller test, every test that reads the start inventory, `playerInventory` or `player_state['inventory']`, games_controller, unlock_response_filter, reload_persistence, npc_give, forged_ko_drop, npc_container_unlock): 851 runs, 7442 assertions, 0 failures. New: start_item_answer_network_test.rb (2 tests: bootstrap, inventory reply, plant, repeat plant and unplug with filtered start items; a pre-change stored inventory filtered in the plant and unplug replies). combination_cryptex_unlock_test's start-item test now checks the stored copy holds no answer.
- JS: 123 files that import a changed module or read a changed CSS file: 1553 tests, 0 failures. New: unlock-r1-ux.test.mjs (wall band, enclosed pocket, one-cell corridor, nine items in a four-cell dead end, blocked body cell, no grid, desks over the rings), combination-cryptex-no-answer.test.mjs (hold on the next dial, two ahead, n4, n5, padlock and cryptex network error), minigame-controls-layout.test.mjs (opt-in overlay, relative overrides, no case-lock glow, n1).
- Validator on test_unlock_gaps: 0 ❌.

Live proof: keyless headless server on :3155 from this worktree, setFPS(20) with fixed steps on and the setTimeout loop. Games 1839, 1844 and 1848 (test_unlock_gaps swapped onto test_seating; the courier given four extra notes in each game's stored scenario, so five items drop). Shots in the scratchpad r2live/.
- 1848: courier's feet put at (284, 112), 12 px west of the lobby's east wall face (x 296; the grid beyond the wall reads as walkable), then KO'd. All five drops landed inside the lobby on walkable cells, all visible on open floor: bag (277, 76), notes at (188, 116), (244, 84), (188, 148), (188, 180). All five were picked up (the bag after Satchel42 and Take Container); the server inventory holds all five and `objects_removed` lists all five. One note needed an approach from below: the harness walk from above stopped short (harness approach, not the drop spot).
- 1844: same setup on the first M1 version: all inside the lobby and walkable, two hidden under the right-hand desks. Led to 7d1643416.
- 1839: a bad teleport left the body inside the back wall; all five drops still landed inside the lobby on walkable cells.
- Padlock network error (1848): Locker set to 12-30-05 by arrow clicks, `/unlock` fetch rejected: status "Network error: 12-30-05 was not checked. Press UNLOCK to try again.", dials 12-30-05 kept, attempts 0, UNLOCK enabled. Network restored, UNLOCK: opened, attempts 0.
- Overlay class (1848): SIEM and backup recovery containers carry `minigame-controls-overlay` with Cancel absolute, bottom at 982 and 980 of 1000; a text file opened after them has no class and an in-flow Cancel.
- Server on :3155 stopped afterwards.
