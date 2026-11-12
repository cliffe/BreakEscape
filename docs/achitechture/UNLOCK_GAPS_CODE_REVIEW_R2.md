Counts: 0 blockers, 3 majors, 4 minors, 6 nits.

# Unlock gaps code review R2 (2026-11-12)

Reviewed `git diff main...build/unlock-gaps-r1` at 8042190b2, with the R1 fixes (d043ab9a1, 1d5a506d2, 36f0c92b0) read against docs/achitechture/UNLOCK_GAPS_CODE_REVIEW_R1.md and the build log's R1, live proof and sweep sections.

## What holds

- **Door cryptexConfig.** The bootstrap allowlist (game.rb:1126) copies `cryptexConfig` into a fresh `kept_fields` hash taken from `scenario_data.deep_dup`, so `strip_lock_answers!` there does not mutate the stored scenario. The controller filter then drops `requires` and strips `answer` again. doors.js and unlock-system.js read only the wheels.
- **KO drops and given items.** Both are built from the filtered NPC payload. The server's canonical inventory copy (`canonical_inventory_item`, games_controller.rb:2255) goes through `filter_requires_and_contents_recursive`, so a picked-up, given or dropped item is stored without its answer.
- **Container contents and /unlock.** Both use `filter_container_contents` (model filter, deep copy).
- **Start inventory on reload, and the three POST /inventory replies.** These now go through `client_inventory` (games_controller.rb:1921). The unrouted `Api::GamesController` still echoes raw, but its own header says it must never be routed. The full list of inventory paths is in M2.
- **Server matching and released NPC containers.** Unchanged since R1; still correct.
- **Padlock.** Hold timers are cleared on pointerup, pointerleave, pointercancel, Reset, success and `cleanup()`. `endMinigame` always calls `cleanup()`, so no tick outlives the window. A tick that fires while `isLocked` or `isSubmitting` is set does nothing. The wrong-answer message is now set after the reset (seen in shot 02).
- **Cryptex.** Up is next and down is previous. A refused word cannot be sent again until a wheel turns. Submit starts enabled.
- **Validator.** test_unlock_gaps: 0 ❌. The new checks (combination, cryptex and wheelCount, NPC-held container with no id) give no ❌ in any of the 177 `scenarios/*/scenario.json.erb`, so they add no failures to shipped missions.
- **Tests (affected files only, no lock).**
  - Rails: combination_cryptex_unlock, npc_container_unlock, unlock_response_filter, forged_ko_drop, reload_persistence, npc_give, games_controller and the network controller tests gave 334 runs, 3819 assertions, 0 failures.
  - JS: the 109 test/js files that import a changed module or read a changed CSS file gave 1371 tests and 1 failure. The failure is event-mapping-unlock-door.test.mjs, with the known runner error "Unable to deserialize cloned data". Its 5 tests pass when it is run alone, and the file is unchanged from main.

## Sync size (q77)

Nothing in this branch adds to `player_state`.
- `client_inventory` makes one filtered copy per response and stores nothing.
- A KO adds one `objects_added` entry per dropped item. That is bounded by the NPC's `itemsHeld`, and each entry is sent once when the drop happens. The spread spots change only the x and y written there.
- The padlock and cryptex keep their state in the browser.
- `cryptexConfig` adds a few fields per cryptex door to the bootstrap, bounded by the scenario.

After the sync-deltas merge (see "Merges") the inventory echoes go away, and only the bootstrap `playerInventory` remains.

## Majors

### M1. A KO drop can land in the next room, through a wall, where it cannot be picked up

npc-hostile.js:554-560 (candidate ring) and 574-579 (fallback ring).

**Failure scenario.**
- Candidates sit on rings 32, 48, 64 and 96 px from the body. Each is snapped with `nearestWalkable(x, y, 1)`, which searches only 8 px round the raw point.
- The world grid (npc-pathfinding.js:602) spans every loaded room, so a raw point beyond a wall snaps to a walkable cell on the far side.
- `obstacles` lists only this room's objects, so a far-side cell also counts as "clear".
- Checked in node: a two-item drop, NPC 12 px west of a 32 px wall, 8 px grid. The first item lands at (284, 228) in the room. The second lands at (332, 196), on the far side of the wall, because both candidates nearer the first item fail the 32 px gap.
- The sprite is registered in `npcRoomId` (npc-hostile.js:605-606, comment: "a drop registered in another room can't be picked up (the same-room rule refuses it)"). From the NPC's room, the wall blocks the reach. From the next room, the same-room rule refuses the pickup. The saved position reloads it in the same place.
- If that item is a key or a container the mission needs, the run is soft-locked.
- The same gap lets a drop jump a desk row into a walkable pocket the player cannot walk to.
- The last-resort ring (574-579) places items with no walkable check at all. With three items in a one-cell corridor, it puts one inside a wall.

**Fix.**
- Pick spots from cells reached by a flood fill over `worldGrid` from the body's cell. Stop the fill at about 4 cells (32 px) beyond the largest radius and keep only cells where `roomIdAtFeet(x, y) === npcRoomId`. That rules out cross-wall cells and enclosed pockets in one step.
- Replace the last-resort ring with stacking on the nearest reached cells (an 8 px offset, as before) rather than placing blind.
- Add a node test with a wall band and two rooms: no spot may sit on the far side, and none may be unreachable from the feet.

### M2. `client_inventory` does not cover every inventory path: the network routes still echo the raw inventory

app/models/break_escape/network_access.rb:209, 235, 263, 311, 335, 423 and 475; game.rb:4952.

**Failure scenario.**
- `initialize_player_state` stores each `startItemsInInventory` item with a shallow `dup` (game.rb:4952), so `requires`, `combination` and `cryptexConfig.answer` stay in `player_state['inventory']`.
- R1 m3 filtered the bootstrap and the three POST /inventory replies only.
- Plant, unplug, join network and implant foothold each return `inventory: player_state['inventory']` in their body, and the controller renders that body as is (`render json: result[:body]`).
- So a scenario with a padlocked case or a cryptex in the start inventory ships its answer on the first network action.
- No shipped scenario has a locked start item today (R1 m3), so this is latent. It is a major because the build log says start-item answers are stripped, and the brief requires that no answer reaches the client by any path.

**Fix.**
- Store start items filtered: run each through `filter_requires_and_contents_recursive` on a `deep_dup` in `initialize_player_state`, as `canonical_inventory_item` already does for picked-up items.
  - No server check reads a lock answer from the inventory copy: `find_scenario_object` reads `scenario_data['startItemsInInventory']` (game.rb:2109).
  - Keep `client_inventory` for games created before the change.
- After the sync-deltas merge, also put the answer strip into `item_for_answer` and into the whole-inventory branch of `inventory_answer_fields` (both on that branch), so every echo goes through one filter.
- Add a Rails test: a cryptex start item, then join a network and check that the reply holds no answer.

### M3. Merging build/ux-access breaks this branch's layout test and leaves the R1 desktop-mode height line unused

container-minigame.css:18; test/js/minigame-controls-layout.test.mjs:69.

**Failure scenario.**
- The two branches auto-merge `.container-minigame.desktop-mode` into one rule. This branch adds `height: calc(100% - 40px)`, and ux-access adds `height: auto` later in the same rule, so `auto` wins.
- That is ux-access's intent (a 16:10 monitor sized by `aspect-ratio`). But this branch's test asserts the calc value.
- Checked on the merged tree: "the password and container panels fit inside the game area with their margins" fails (`expected 'calc(100% - 40px)'`, `actual 'auto'`). The merge batch's JS suite would go red.

**Fix.** When merging, keep `height: auto` and remove the `calc(100% - 40px)` line. Change the test to assert that the desktop-mode rule does not set a percentage height. Then take one screenshot of a desktop-mode container (with a post-it) at 1400x1000 and at 915x412, to confirm that ux-access's `max-height: calc(100vh - 440px)` still keeps Take above the in-flow Cancel row.

## Minors

### m1. The case-lock look keeps the password field's soft cyan glow

password-minigame.css:189, seen in shot 08 after.

**Failure scenario.** `.password-field:focus` still has `box-shadow: 0 0 10px rgba(0, 255, 255, 0.3)`, which is a soft glow on the new brass panel. It breaks the pixel-art UI rule for UI this branch changed.

**Fix.** ux-access sets it to `box-shadow: none`, so the merge removes it. If this branch merges first, add a `.case-lock .password-field:focus { box-shadow: none; }` rule.

### m2. The four-console exception is a class allowlist, and three older overrides cancel the new paint order

minigames-framework.css:121-129; examine-minigame.css:72, forensic-data-platform-minigame.css:398, biometrics-minigame.css:608.

**Failure scenario.**
- The exception is sound for the four consoles it lists. Their frames reserve a bottom bar, and the overlay is exactly main's placement.
- But it is keyed on four container class names. A new full-window console, or one of the 26 swept scenes that hides Cancel today and starts showing it, will get its Close pushed off-screen, with no test to catch it.
- Separately, examine, the forensic data platform and the fingerprint reader set `position: static` on `.minigame-controls`. That cancels the new `position: relative; z-index: 1`, so spilled content there is painted over Cancel again.

**Fix.**
- Let the scene opt in: for example a `controlsOverlay = true` field on the MinigameScene subclass, which adds a `minigame-controls-overlay` class to the container. The CSS then keys on that class, and the layout test asserts that the four scenes set it.
- Change the three `position: static` overrides to `position: relative`.

### m3. Holding the next dial's arrow does not spin it

combination-minigame.js:133-136.

**Failure scenario.**
- After setting dial 1, a player presses and holds dial 2's arrow, expecting a spin as on dial 1.
- The first tick sees `dialIndex !== this.activeDial` and stops the hold. On release, the click sets dial 1 and turns dial 2 by one.
- So every move to a new dial needs a click, then a second press to spin. That is a small trap on the one part the help line promises ("hold to spin").

**Fix.** In `tick`, when `dialIndex === this.activeDial + 1`, call `_rotateDial` (which sets the current dial and moves on), set `_holdFired`, and keep the timer going.

### m4. A network failure counts as a wrong try, and the cryptex then refuses to resend the same word

combination-minigame.js:338-340 with 288-289; cryptex-minigame.js `_validateWithServer` with `_handleFailure`.

**Failure scenario.**
- A request that never completes sets "Network error. Try again." and returns false. `_handleUnlock` then calls `_handleFailure`, which counts an attempt and overwrites the message.
- On the padlock it also resets every dial to 00 (new in R1). On the cryptex it stores the word as `lastTried`, so Submit stays disabled for the right word until a wheel is turned away and back.
- A Wi-Fi blip costs an attempt, wipes the padlock entry, and tells the player that a possibly correct answer "did not open it".

**Fix.** Mark the network case (for example `this.networkError = true`) and branch on it in `_handleUnlock` and `_handleSubmit`. Show the message, keep the dials or wheels, do not count an attempt, and do not set `lastTried`. Add a JS test with a rejected `fetch` and no status.

## Nits

- **n1 SIEM list, half a row.** With `min-height: 0` the SIEM game area is 40 px shorter, and the alert stream shows 8.5 rows instead of 9 (shot 26). Grade: acceptable. The cut row is a fair scroll cue, the counter still reads "Alerts pending: 17", and nothing is lost. If a fix is wanted, `.siem-minigame-container .minigame-game-container { min-height: auto; }` puts back main's height for the four overlay consoles only, since none of them needs the shrink.
- **n2 Cancel now sits below the window frame.** Seen in shots 18, 20 and 41. The frame belongs to the game area, so the in-flow Cancel row lands on the dark band beside the dimmed hearts, notes and Block/Punch HUD. It works and is never covered. It would read better inside the frame: move the frame art to `.minigame-container`, or give the controls row the frame's bottom edge.
- **n3 Stale evidence for the case lock.** Shot 08 (case lock) predates the sweep fix and shows Cancel hidden under the panel. The manifest says so, but no fixed case-lock shot exists. Re-shoot it after the ux-access merge, when the panel gets both `prompt-mode` and `case-lock`.
- **n4 `_holdFired` can stick.** combination-minigame.js:126 and 136. A hold that fires, then leaves the button and is released elsewhere, gives no click, so `_holdFired` stays true. A pointer press clears it, but a keyboard Enter or Space on an arrow is swallowed once. Clear it in `_stopHold` when the stop came from `pointerleave` or `pointercancel`, or on `keydown`.
- **n5 Sound at spin speed.** combination-minigame.js:176 plays `keypad` on every tick, about 22 a second after 8 repeats. Play it on every third tick while spinning.
- **n6 Container labels.** container-minigame.css:349 uses `text-shadow: 1px 1px 0 #000`. It is hard-edged, so it is not a soft shadow, but it is a 1px offset under the 2px rule. ux-access uses the same 1px outline for desktop icon labels. Pick one (2px offset, or none on the dark grid) when the two branches meet.

## Merges

Checked with `git merge-tree --write-tree` against each branch.

1. **build/ux-access (b5633eca6).**
   - It conflicts in password-minigame.js (two hunks). It auto-merges minigames-framework.css, password-minigame.css and container-minigame.css.
   - **password-minigame.js, first hunk.** Keep both helpers, `CASE_LOCK_TYPES` / `isCaseLockTarget` and `SCREEN_TYPE` / `passwordScreenKind`.
   - **Second hunk.** Keep both classes:
     `<div class="password-minigame-area${kind === 'prompt' ? ' prompt-mode' : ''}${caseLock ? ' case-lock' : ''}">`
     Keep the `caseLock` line as well.
     - A bag is not a screen type, so it gets both classes. `.password-minigame-area.case-lock …` (three classes) outranks `.prompt-mode …` (two), so the brass panel wins and the prompt's `min-height: 0` still applies. That is the wanted result.
     - ux-access's `.password-prompt-title` is drawn in prompt mode, so check that a bag does not show the title twice beside the case-lock label.
   - **minigames-framework.css.** It merges cleanly: ux-access only removes the success and failure glows.
   - **container-minigame.css.** See M3: keep `height: auto` and fix the test.
   - **password-minigame.css.** Clean. The focus glow goes, which closes m1.
2. **build/sync-deltas (cb269170c).**
   - It conflicts in games_controller.rb in three places: the inventory "already" reply, add and remove.
   - Take the sync-deltas side for all three (`{ success: true, already: true }` and `{ success: true }`). sync-deltas found that no client reads the echo, and dropping it removes the leak path as well as the bytes.
   - Keep `client_inventory` for `playerInventory` in GET /scenario. sync-deltas leaves that line raw (its line 420), so the merged file must keep this branch's version.
   - Then do M2's `item_for_answer` and `inventory_answer_fields` change. Those are sync-deltas' new inventory paths, and they read `player_state['inventory']` directly.
   - `saved_cards` stays in `playerInventory` on both branches (the bootstrap needs it). `client_inventory`'s filter does not touch it.
3. **main (33c003230).**
   - It merges cleanly. main's usePayload-secret work adds `strip_capture_secrets!` to both payload filters next to this branch's `strip_lock_answers!`, in separate lines.
   - After merging, run the validator on test_unlock_gaps and on every test scenario either side touched, since main's validator also changed. Rerun combination_cryptex_unlock_test and unlock_response_filter_test, since both filters gained a strip on each side.

## Not checked

- No new live run. The live proof in the build log (game 1764) covers the padlock, cryptex, Archive door and KO drop paths on this tip.
- The M1 cross-wall case was shown in node with a synthetic grid, not in a room.
- The merged trees were checked by trial merge and by the one layout test above, not by full suites.
