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
