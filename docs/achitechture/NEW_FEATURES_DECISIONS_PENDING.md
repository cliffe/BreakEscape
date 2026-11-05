# New engine features — decisions pending (2026-11-05)

Raised by the feature test work (docs/achitechture/NEW_FEATURES_TEST_MATRIX.md) and the needs demo (scenarios/test_needs_sims/README.md). Engine and server changes need the user's approval (AGENTS.md).

## D1. Needs home never resolves for NPCs in the start room (engine bug)

- **What happens:** `npc-needs.js:301` caches the home on the first tick: `if (!s.home) s.home = this._resolveHome(s, pos)`. If the `needsHome` object isn't found yet, `_resolveHome` (`npc-needs.js:628-640`) returns the spawn point with `objectId: null`, and that result is never replaced. The start room's NPCs register before its objects exist (`core/game.js:2004-2006`), so for them the home-object preference (`npc-needs.js:475`, commit f816f09a5) never applies and staff work at each other's desks. Found live in test_needs_sims game 499; a room that loads later resolves correctly.
- **Proposed fix (small):** when `needsHome` names an object that isn't found yet, mark the home as provisional and try again on later ticks until the object is there. Add a node test for the late-object case and re-run test_needs_sims live.
- **Recommendation:** fix it. It's a bug in a feature built this week, and lab_physical_pentest relies on the same preference.

## D2. Needs debug overlay (engine addition)

- **What:** an opt-in `systems/npc-needs-debug.js` that draws each NPC's need bars above their head (off by default, switched on by a scenario flag or a `__test` call). About 150 lines plus three one-line hooks. Proposal in scenarios/test_needs_sims/README.md.
- **Why:** today the only signs on screen are the job icon and the console. The demo can't show what each NPC wants without it.
- **Recommendation:** build it, opt-in only, so the demo can show the system and testers can see the state.

## D3. Server hides a room item that matches an inventory item by type and name (server behaviour)

- **What happens:** `games_controller.rb` `item_in_inventory?` (around line 1766) treats a room item as already collected when the inventory holds anything of the same type and name, even with a different id. test_needs_sims worked around it by renaming the floor mugs.
- **Open question:** this may be deliberate (stops a collected item reappearing on reload) or a bug (identical props can't coexist).
- **Recommendation:** have an agent find out why it matches on type and name rather than id (git blame, tests). Report before changing anything, because it affects every mission.

- **Outcome (investigation):**
  - **What it matches on.** Two copies of `item_in_inventory?` with the same logic: `Game#item_in_inventory?` (`app/models/break_escape/game.rb` ~725) and a private one in `games_controller.rb` (~1737). A room item counts as held when an inventory item has the same `type` and then any of: the same id (`ItemIdentity.identity_candidates(...).first`, so `id`, else `opens_lock`/`key_id`), or the same non-blank `name` (checked even when both ids are present and differ), or neither side has an id or name (type alone).
  - **Callers.** (1) `Game#filtered_room_data` (game.rb ~952) rejects matching `room['objects']` on every room load, first visit and reload alike, so it hits all missions. Top-level objects only: NPC `itemsHeld` and `tableItems` are not filtered. (2) The controller copy is used only by `filter_container_contents` (~1724), for lazy-loaded locked-container contents. The output goes to the client as room/container data; nothing else reads it.
  - **Why it exists.** It is deliberate, as a safety net, not a vestige. The container filter came in 629aa229b (2025-12-04, "filter container contents to exclude items already in the player's inventory", plus "type-based and ID-based matching" so reload recovery works). The room-object filter came in dbd532fdc (2026-02-17); its comment says it must run even when `objects_removed` was never written, "e.g. StateSync beat removeItemFromRoom", so an item the client picked up but whose removal did not reach the server does not reappear after reload. The name fallback matches the `ItemIdentity.same_item?` convention (any shared id, else shared name). No test pins the name or type-only fallback: nothing under `test/` calls `item_in_inventory?` directly, and the `game_test.rb` drop/pickup cases use matching ids throughout.
  - **Protected cases.** Items whose id is missing on one side (keys carry `opens_lock` and often no `id`; documents carry `id` and no `opens_lock`; a client copy may drop the id). That is the case the name leg covers. Not needed for NPC gifts or `give_item`: those are tracked separately (`record_npc_gift!`, `npc_given_items`) and do not go through this filter.
  - **What goes wrong today (a real bug, not just test_needs_sims).** `lab_intro_linux/lockpicking_room` has five takeable suitcases with one name per group: "Locked Briefcase" (`document_bag_1`, `_2`, `_4`) and "Locked Bag" (`_3`, `_5`). Once the player holds one, the server hides its siblings from that room on the next load (reload, or the room's first load after pickup). A fixed, untakeable same-name prop is hidden the same way if the player holds a matching item. Other same-type-and-name pairs in a room (`m02_ransomed_trust/reception_lobby` two "Self Check-in Kiosk" pcs, `m01_first_contact/main_office_area` two "Office Chalkboard"s with no ids) are fixed props, so they are only exposed if the player ever holds a copy. A scan of all 188 scenario dirs found no room object that shares type and name (with a different id) with a `startItemsInInventory` item or an NPC `itemsHeld` item; the only room-versus-start/held overlaps (`npc-patrol-lockpick` Vault Key, `test-rfid-multiprotocol` RFID Flipper) have the same id (none set), where id matching would still catch them.
  - **If it matched by id only.** Anything that relies on the name leg to dedupe breaks: inventory copies without an id against room objects with one, and (in id-less scenarios) any key or item that has neither `id` nor `opens_lock`. Id-less room objects would never be hidden, so a collected id-less item could reappear after reload if `objects_removed` is missing. Scenarios that give a room object and the inventory copy different ids on purpose would reappear; the scan found none, but other agents' in-progress scenarios were not checked beyond the 188 dirs.
  - **Recommendation: change to "id when both sides have one, name only when either side has no id".** That mirrors `ItemIdentity.addressed_by?` (which already says: if both have an identity, only a shared id counts; names are used only when one side has none). Keep the type-only leg. Apply it to both copies, ideally by replacing both with one `ItemIdentity` helper so they cannot drift. This fixes the lockpicking-room siblings and test_needs_sims (after which the mugs could go back to the same name) while keeping the safety net for id-less items. Risk: low, one-directional (fewer items hidden). Residual risk is the id-less pair case above; the scan found none.
  - **Tests a change needs.** In `game_test.rb`: (a) two room objects, same type and name, different ids, inventory holds one: `filtered_room_data` keeps the other; (b) same id: hidden; (c) inventory item without id vs room item with id, same name: hidden; (d) room item without id vs inventory with id, same name: hidden; (e) both id-less, same name: hidden; (f) key with `opens_lock` only on both sides: hidden. The same cases for `filter_container_contents` in `games_controller_test.rb`. Then a live check on `lab_intro_linux` (take one briefcase, reload, the other two still there) and a reload check on one mission with id-less keys (m01). Per the fix-claims memory, the helper tests are not enough: the live reload is the proof.

## D4. Two loadRoom calls at once both load the room (engine bug)

- **What happens:** `core/rooms.js:781` checks `window.rooms[roomId]` before its first `await`, so two overlapping `loadRoom` calls each fetch the room and load its NPCs. `createRoom`'s own guard stops a duplicate room, but NPC loading can run twice. Shown by the skipped test "two simultaneous calls fetch once" in `test/js/load-room-idempotent.test.mjs` (commit 1cea1c34f).
- **When it can happen:** a route NPC's `unlockRoom` loads the room while the player clicks the same door, which is exactly the lab's tailgate moment.
- **Proposed fix:** keep a per-room in-flight promise and return it to the second caller; un-skip the test.
- **Recommendation:** fix it. It's small and contained, and the lab's tailgate can hit it.

## D5. A route `unlockRoom` without an `unlockDoor` mapping retries forever without telling anyone (tooling)

- **What happens:** an NPC route action `unlockRoom` only works if the NPC also carries an `unlockDoor` eventMapping for that room (server permission, `game.rb` `npc_mapping_unlocks_door?`). Without one the NPC silently retries at the door forever. It bit test_gate_tailgate (b7a6f8b87), and a reviewer removed the lab's mapping as "dead" (5e12edcd9, restored in 3ad1e358c).
- **Proposed fix:** a validator error when a route `unlockRoom` has no matching `unlockDoor` mapping on the same NPC, plus a one-time console warning in `_runRouteAction` when the unlock is refused.
- **Recommendation:** add both.

## D6. m07: Ray Hollis never patrols while the player is near the spawn (other mission)

- **What happens:** Ray's patrol pauses to face the player within 96 px (`pauseForPlayer` defaults to true, `npc-behavior.js:396,407-408,854`). The m07 spawn is 55 px from him, so he stands still until the player walks away. Already there before this week's engine work (reproduced on the parent of 4143d47d0).
- **Proposed fix:** set `"pauseForPlayer": false` (or a smaller `facePlayerDistance`) on Ray's patrol. His line-of-sight challenge already covers the player being noticed.
- **Recommendation:** fix it in m07 (one line). It's another mission, so it needs your OK.
