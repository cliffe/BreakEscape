Counts: 0 blockers, 0 majors, 1 minor, 4 nits.

# Unlock gaps code review R3 (2026-11-12)

Reviewed `git diff main...build/unlock-gaps-r1` at e937b75f8, with the R2 fixes (8456ae01c to e937b75f8) read against UNLOCK_GAPS_CODE_REVIEW_R2.md and the build log's "R2 fixes" section.

## What holds

**KO drops (R2 M1).**
- *Room bound.* `inRoom` uses `roomIdAtFeet(x, y, window.rooms, 0) === npcRoomId` (npc-hostile.js:708). That is the test updatePlayerRoom and the same-room rule use. So every reached cell is one where a player standing beside the item counts as being in the item's room. Cells beyond a door gap fall in the next room and are cut. See m1 for the one way the bound can still be escaped.
- *Reachability.* `koDropSpots` only ever returns reached cells: both clear passes, both hidden passes, the half-gap pass and the stack. The flood fill runs over the grid built from the live physics bodies. So a cell the fill reaches is one the player's body can walk to, from the floor round the body, without leaving the room.
  - The new order (clear ring spots, then clear reached cells nearest first, then hidden spots) cannot pick an unreached cell.
  - Checked in node with walls built the way collision.js builds them, plus the grid's padding:
    - a north room over a south room with a door, and the body at five heights across the door tile: every spot lies inside the room it is registered in;
    - an east wall with the body 2 px clear of the strip: every spot is on the floor side.
- *Door tile.* Rooms overlap by the south room's two wall rows, so feet in the door gap always resolve to one room. If the cell under the feet resolves differently at half height 0, the two-cell start search finds the right side. In the five cases above the drop room changed at the right line, and no spot left it.
- *Behind a south room's back wall.* A spot can land in the north room's bottom strip, where the south room's back wall overlaps it. It is still drawn: behind-wall-fade.js:201 puts the wall caps "below anything of N's standing in them". I checked this because the ring tries below the body first.
- *Performance.* The fill stops at 128 px from the feet, so room size does not matter: about 800 cells at most. Worst case in node: 10 items, 200 obstacles and 30 loaded rooms (each `inRoom` call walks every room) took 5.8 ms per KO. It runs once per knock-out, not per frame. The sort and the ring snapping are bounded by the same 800 cells.
- *No grid.* With no `worldGrid`, or no in-room walkable cell within two cells of the feet, every item lands on the body, 4 px apart. They are drawn over the body (item depth is its bottom + 0.5, below the feet), and each can be picked. That is no worse than main's 8 px ring. See n4 for the fallback room.

**`Game#client_inventory` (R2 M2).**
- *Routes.* All seven network replies use it: network_access.rb:209, 235, 263, 311, 335, 423 and 475. So do the bootstrap `playerInventory` (games_controller.rb:408) and the three POST /inventory replies (1052, 1078, 1086), through the controller's one-line delegate. No other response sends `player_state['inventory']`. The unrouted `Api::GamesController` still echoes it raw, and its header says it must never be routed.
- *The filter.* It has everything the old controller filter had, plus `strip_capture_secrets!`. The client never read capture secrets from the inventory: GET /capture_secrets serves them from the scenario. It keeps `contents` and every field the client reads.
- *Start items stored filtered.* `initialize_player_state` (game.rb:5107) runs a `deep_dup` of each start item through `filter_requires_and_contents_recursive`. I looked for any server path that reads a stripped field (`requires`, `combination`, `cryptexConfig.answer`, a locked item's `contents`, `flags`, `hintOnlyFlags`, `puzzle_graph_*`, capture secrets) from `player_state['inventory']`. None does. The inventory readers are:
  - the key, lockpick and keycard checks: `type`, `key_id`, `opens_lock`, `card_id`;
  - the RFID cloner, Friendface phone, grant and USB-stick holders: `type`, `id`, `phoneOf`, matched by `ItemIdentity.held_in?` against the scenario copy;
  - plant, drop and wear: they persist the held copy, which picked-up items have always stored filtered.

  Every lock and container lookup reads `scenario_data`, never the inventory copy. A scan of all 177 scenarios found no start item that is locked or has `contents`, `flags` or a capture secret. So no shipped mission's stored inventory changes shape.

**`controlsOverlay` (R2 m2).**
- *The opt-in.* `MinigameScene.init()` toggles `minigame-controls-overlay` from `this.constructor.controlsOverlay === true` (base-minigame.js:45). The four consoles set it. No class extends them, so nothing inherits it by accident.
- *Clearing.* minigame-manager.js:159 creates a new container per start, so the class cannot carry over to the next scene. The two scenes whose `init` skips `super.init()` (network segmentation map, title screen) start with a fresh container, so they never get the class.
- *Static to relative.* Safe. The base `.minigame-controls` rule (minigames-framework.css:105) has no `top`, `left`, `bottom` or `transform` left over from the old absolute placement. So `position: relative` with `z-index: 1` moves nothing in examine, the forensic data platform or the fingerprint reader. It only puts Cancel above spilled content, as intended.
- *Overlay height.* `.minigame-controls-overlay .minigame-game-container { min-height: auto }` outranks the framework's `min-height: 0` (0,2,0 against 0,1,0), so n1 is fixed for the four consoles only.
- *Pixel-art rule.* The forensic platform's controls border is now 2px, and the case-lock focus glow is gone. No other UI changed.

**Network errors (R2 m4).**
- `ApiClient.post` (api-client.js:47-57) throws with `err.status` set for every non-2xx answer, and a 200 with `success: false` returns normally. A wrong combination or word (422) therefore reaches `if (error?.status) return false` (combination-minigame.js:352, cryptex-minigame.js:327) with `networkError` still false. `_handleFailure` then counts it, exactly as before.
- Only an exception with no status sets `networkError`, and both handlers clear the flag before each send. A real wrong answer can never be taken for a network error.
- The scope-refusal branch is checked first, so a PC refusal is unchanged.
- The cryptex network branch leaves `lastTried` alone. Submit is never offered for a word equal to `lastTried`, so no network-error resend can repeat a refused word.

**Padlock hold (R2 m3, n4, n5).** A hold on dial `activeDial + 1` turns it through `_rotateDial`, which sets the current dial. Later ticks then see it as the active dial and keep spinning. A hold two dials ahead still stops. The release click is swallowed by `_holdFired`. A keydown clears a stuck flag before the click it causes.

**Merge note (M3, ux-access).** I ran a trial merge of build/ux-access at its current tip (442d2f534) in a throwaway detached worktree, since removed. The result:
- the only textual conflict is password-minigame.js, with two hunks;
- with them resolved as both logs say, `node --check` passes;
- container-minigame.css merges with both `height` lines in `.container-minigame.desktop-mode`. After deleting the calc line as the build log says, `minigame-controls-layout.test.mjs` fails only on line 93 (expected calc, actual auto). After changing that line to assert no percentage height, the 20 test files that read the password, container, framework, padlock or cryptex code or CSS pass (229 tests, 0 failures);
- the R2 tests for the overlay opt-in, the relative overrides and the case-lock glow pass on the merged tree.

So the M3 steps are correct. See n2 for two wording points.

**Sync size.** Nothing new in `player_state`. Start items are stored smaller (answers stripped). Each network reply sends the same inventory as before, filtered: one copy per response, nothing stored.

**Tests and validator.** All run without the lock, affected files only:
- Rails (20 files): start_item_answer_network, combination_cryptex_unlock, npc_container_unlock, the ten network_* controller tests, lab_physical_pentest_network, games_controller, the game and network_withholding model tests, unlock_response_filter, reload_persistence, forged_ko_drop and npc_give. 445 runs, 4498 assertions, 0 failures.
- JS: the 123 test/js files that import npc-hostile, the padlock, the cryptex or base-minigame, or that read a changed CSS file. 1594 tests, 0 failures.
- Validator on scenarios/test_unlock_gaps/scenario.json.erb: 0 ❌.

## Minors

### m1. A body inside a side wall's collision strip puts every drop behind the wall

npc-hostile.js:626-637 (the start-cell search) with npc-hostile.js:708 (`inRoom`).

**Failure scenario.**
- `roomIdAtFeet` tests the room's whole map rectangle, side wall tiles included.
- An east wall's collision box is the first 8 px of the wall tile (collision.js:99), so x 288 to 296 in a 320 px room. The grid blocks cells 280 to 304 with its padding. Cells 304 to 320 read as walkable and are still inside the room's rectangle. They form a sealed column behind the wall.
- If the body's centre ends up inside the strip, the two-cell search picks the nearest in-room walkable cell. From x 293 onwards that is the sealed column, not the floor.
- Checked in node with collision.js's geometry: feet at (294, 160) or (298, 160) reach 54 cells, all in the column. All three drops land at x 308 to 316, behind the wall, where the player cannot reach them. Feet at (286, 160) are fine.
- A body only gets there by tunnelling or a bad teleport. The build log's game 1839 left a body inside the back wall that way. So this is rare, but it is a soft-lock when the drop is a key or the case the mission needs.

**Fix.**
- Bound both the start search and the fill by the room's floor as well as its id. `roomFloorRect(window.rooms[npcRoomId])` from interaction-walls.js is the walkable floor inside the walls. For example: `inRoom: (x, y) => roomIdAtFeet(x, y, window.rooms, 0) === npcRoomId && insideRect(floor, x, y)`, where `floor` is that rect widened by one door depth on the side of any doorway, so that a doorway cell stays usable, or simply not widened.
- Add a node case to unlock-r1-ux.test.mjs: east wall built as collision.js builds it, feet at x 294. No spot may be beyond the strip.

## Nits

- **n1. No test covers the join and implant replies.** start_item_answer_network_test.rb:33 and :64 cover the bootstrap, an inventory reply, plant, a repeat plant and unplug. Join Wi-Fi (network_access.rb:311, 335) and implant foothold (423, 475) use the same one-line `client_inventory` call, checked by reading the code. A third test that joins an access point and implants on a PC, with a cryptex start item, would pin the other four replies.
- **n2. The M3 wording.**
  - UNLOCK_GAPS_BUILD_LOG.md:143 says "change the last assertion in test/js/minigame-controls-layout.test.mjs". The file's last assertion is the notes test (line 102). The one to change is line 93, the last assertion of "the password and container panels fit inside the game area with their margins". Name the test.
  - ux-access's build log (its M1 resolution) says to assert `auto`, and this one says to assert "no percentage height". Both pass. Pick one, so whoever merges does not wonder which branch's note to follow.
- **n3. A 5xx counts as a wrong try, and a coding error reads as a network error.**
  - A 500 from /unlock has a status, so the player sees "did not open it" and loses an attempt for a server fault. A wrong answer must still count, and it does, so only a 5xx needs to change.
  - Any exception with no status shows "Network error", even one that is not a network failure (a TypeError in the handler, a JSON parse failure on a proxy page).
  - Fix: treat `error.status >= 500` like `networkError` (no attempt, keep the entry), and set `networkError` only for a `TypeError` from `fetch` or an `AbortError`. Anything else should get a plain "Could not check" message.
- **n4. The empty-cells fallback stacks on the body in whatever room the fallback chose.** npc-hostile.js:565 and the pre-existing `npcRoomId = fellIn || npc.roomId` (line 682).
  - When the feet are in no room's rectangle (a gap between rooms), the drops register in the NPC's home room. That may not be the room the player is in, and the empty fill then puts every item on the body.
  - This is not new (main does the same with an 8 px ring), and the rooms overlap at N/S doors, so I found no shipped layout that hits it.
  - Fix, if wanted: when `fellIn` is null, take the room of the nearest walkable cell that some room's `roomIdAtFeet` accepts, and fill from there.

## Not checked

- No live run. The sealed column in m1 and the door cases were shown in node with grids built to collision.js's rules, not in a room.
- The 440 px budget for ux-access's desktop screen after the merge is still owed a live check (both build logs list it). The trial merge ran the layout tests only.
