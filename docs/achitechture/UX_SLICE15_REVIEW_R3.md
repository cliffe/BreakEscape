Counts: blockers 0, majors 0, minors 2, nits 2

# UX slice 15 review, round 3 (world marks and switches)

Branch `build/ux-world` at 6f048d24c. Read against `UX_SLICE15_REVIEW_R2.md`, the build log's "R2 fixes", "R2 fixes, final" and both R2 handovers, commits 82468e97a to 6f048d24c, and the UI design language.

Orchestrator rulings, checked against the build:
- Kitchen copier socket: not moved. It is still at `scenarios/test_needs_sims/scenario.json.erb:747` (x 9.05, y 6.4) and is recorded below as m2.
- South-gap drop on the black door gap, picked up again: accepted. The build is unchanged there.

## Findings

### Minor

**m1. `public/break_escape/js/systems/lighting.js:1338` and `:1351`: in a dark room the screen glows draw over the indicator mark, so the locked mark loses its blue and the ring turns grey.**
What breaks: every `above` glow, and every glow in a dark room, gets depth `LIGHT_DEPTH + 1`. The mark has the same depth and sits under the ADD screen glows in the display list. Probe on game 2712, office switched off with `lightingSystem.switchOff('office')` and `amara_pc_screen_locked` set: the mark (`be_indicator_dot_ring_4`, normal blend) is at display index 146, with two `be_light_soft` ADD glows over it at 147 (alpha 0.54) and 148 (amara's own screen glow, alpha 0.31). As rendered, the locked dot reads #ffffff instead of #7ab4ff, and the ring reads #aba8aa instead of #0c142c. The open mark goes white the same way. So in a dark room the two states differ only in size and breathe, and the blue light pool round the PC (0x3d8bff on the light map) no longer matches the mark on it. Measured on the rendered pixels (better of ring or dot against each screen pixel round the mark, worst over those pixels): lit office 3.12 to 11.62 for every picture and state; dark office 1.24 to 2.36 (`dots-lit-sheet.png`, `dots-dark-sheet.png`, `dark-2-amara_pc-3x.webp`). The R2 tables measured raw PNGs only, so they could not show this. The depth is older than this round, but the ring and the new fill are what is lost.
Fix: draw indicator marks above every glow, for example `setDepth(e.indicator ? LIGHT_DEPTH + 2 : above ? LIGHT_DEPTH + 1 : obj.depth + 0.01)`. Add a node test that an indicator's depth is above an `above` screen glow's, and take a 3x shot of a locked and an open mark in a switched-off room.

**m2. `scenarios/test_needs_sims/scenario.json.erb:747`: the kitchen copier socket cannot be used by a click (orchestrator ruling, not yet done).**
What breaks: a real `page.mouse.click` on the socket from the kitchen (game 2751) walks the player to feet (-43.9, 196.5), and no dialog opens. Used directly (`handleObjectInteraction`), both confirms work: "Switch off the kitchen copier at the wall?" with "Switch off" / "Leave it", then "Switch the kitchen copier back on at the wall?" with "Switch on" / "Leave it". "Leave it" keeps `kitchen_copier_off`.
Fix: move the socket to a spot the player can reach, as ruled (the builder suggested y 7.4, level with feet (-44, 236)), and prove it with a real click.

### Nits

**n1. `public/break_escape/js/systems/item-drop.js:254-265`: `pickupReachable` is not quite the arrival rule its comment names.** The real check (`interactions.js:2274` `isObjectInInteractionRange`) measures x to the nearest point of the sprite (`reachX`), allows the full 32 px and also needs `interactionLineClear` (same room and no wall between). `pickupReachable` uses the centre with 30 px, which is stricter and safe, but it skips the wall test. It also does not check that the stand cell can be walked to from where the player is. Neither gap shows in practice. In a sweep with the arrival rule as written (reachX, 32 px, `wallClearFrom` with the player's feet) and walk-grid connectivity from the feet (8-connected, no corner cutting, and 4-connected), 0 of 55,023 drops from feet in each room's main walk area fail (test_access_work, all 23 rooms loaded, three facings, game 2711). The office in test_needs_sims has desk islands; there too, 0 of 2,394 fail (games 2712, 2713, 2714). The only feet cells the grid does not join to their room are the wall columns at x 4 to 12 and 308 to 316 behind closed side doors, which R2 showed a walk cannot reach. Of 100 such cells in the office, 92 drops can be picked up from the main floor.
Fix: say in the comment that the centre measure and margin are deliberately stricter than `reachX`, and that walls and connectivity are not checked. Or pass `wallClearFrom` in `reachDeps` if a room with an inner wall ever needs it.

**n2. `docs/achitechture/UX_SLICE15_BUILD_LOG.md:129` and `:160`: the contrast measure is described as the "worst of ring or dot" and the "worst mark-against-screen contrast", but the script takes the better of ring or dot for each screen pixel, then the worst over pixels.** The numbers are right for that measure. On the rendered lit office I get the same picture: every mark is at 3.12 or more. Alone, the dot is 1.0 to 1.5 against blue and cyan screens; the ring carries the mark there, which is what R2 asked for. Fix: reword both lines to "for each screen pixel round the mark, the better of ring or dot; the worst over those pixels".

## What checks out

- **pickupReachable is the pick-up's distance rule.** The sprite centre is the feet minus the foot offset, and the item's sprite has origin 0.5. Plain centre distance within 30 px is a subset of the arrival check: `reachX` within 32. The 2 px covers the whole-pixel top-left rounding (at most 0.5 px) with room to spare. `roomIdAtFeet` with the player's half height is the same lookup `sameRoomFrom` makes at arrival. The final fallback, the feet cell, is not checked; the sweep found no drop from a main-area feet cell that the arrival rule refuses.
- **Cost.** `pickupReachable` averages 20 `findNearestWalkableWorldCell` calls and 0.004 ms per candidate, with a worst call of 0.6 ms; it runs only after the cheaper checks pass. `dropPoint` with it: median under 0.1 ms, 0.2 ms at the 99th percentile, 3.1 ms at most over 55,023 calls with 23 rooms loaded. A drop calls it twice.
- **North strip, live** (game 2715): `post_usb` dropped from feet (47.9, 48.3) in `usb_room` lands at (52.5, 44) in `usb_room`, in reach. From the lobby, a real click walks the player into `usb_room` (52.1, 54.5), in reach. The first click only walks, since the item is in another room (by design, code review R1 m1); the second picks it up. From the lobby's west doorway (feet (47.7, 77.2)) the drop lands at (44.5, 84) in the lobby. From `hall_a`, a click walks into the lobby (43.6, 102.4), and a second click picks it up.
- **Tap stand points, no regressions.** Doors and NPCs do not go through `objectStandPoint` (`game.js:2339-2370`, `:2412`), so the change cannot touch them. For objects, `wallClear` (`wallClearFrom`) already refused a stand point in another room, so the new `sameRoom` rule changes only two things. A stand point in no room (a door gap) now counts as the player's current room, which matches the arrival check. And the north-only second pass runs only when nothing else is usable. Measured: `objectStandPoint` with and without `sameRoom`, for every interactable object in every loaded room, from the room's middle and lower middle (games 2711 to 2714), gives the same point in every case. The objects within 72 px of a door, with the doors as left after the doorway run (game 2715), are also unchanged, but that is only 4 object-and-start pairs, so it is a thin check.
- **Dot fill 0x7ab4ff.** The table in the log is right for its measure (n2). The rendered lit office agrees, and the light-blue fill and cream open mark are told apart by hue, size and breathe (`dots-lit-sheet.png`). In a lit room the 0x3d8bff light adds only a faint blue round the screen and reads with the mark. In a dark room, see m1.
- **Named confirm pairs, live**, both ways, each with "Leave it" keeping the global, one dialog per click, and the next click offering the other way:
  - coffee socket and office copier socket (game 2751);
  - kitchen copier socket (game 2751, direct use, m2);
  - Ian's socket (game 2757, `cable_room`);
  - Greg's socket (game 2714, `f12_room`);
  - breaker and rack power (game 2713).
  The skinned frame, pixel font and named buttons hold (`sw-kitchen_copier_socket-3-on.webp`).
- **Rack hint, live** (game 2713): breaker "Flip it", rack "Switch on", a second trip and a second "Switch on". Both times "The rack powers up. The server network is back." shows and `servers_offline` goes false. A click with the rack on shows "The server rack is on." and no dialog.
- **No new player_state.** The round adds no synced field. The drop payload is unchanged (room, x, y, onTable), and the scenario changes reuse existing booleans (`office_coffee_off`, `office_copier_off`, `kitchen_copier_off`, `servers_offline`).

## Verification

- Server: keyless, headless, port 3366 from this worktree; setFPS(20) with fixed steps on; browser with scrollbars shown, 1400x1000. Stopped by its PID afterwards.
- New games via `tools/playtest/swap-scenario-game.rb` on host test_seating:
  - 2711: test_access_work, unlock-all (sweep, stand points);
  - 2712: test_needs_sims (sweep, stand points, dots lit and dark, dark probe; globals and textures forced in the page);
  - 2713: test_access_networks, server_room (sweep, stand points, breaker and rack);
  - 2714: test_access_social, f12_room (sweep, stand points, Greg's socket);
  - 2715: test_access_work, unlock-all (north strip, west doorway, near-door stand points);
  - 2751: test_needs_sims (sockets);
  - 2757: test_access_work, cable_room (Ian's socket).
- Shots and reports: session scratchpad `ux-shots/slice15-r3/`. Scripts: `s15r3_*.mjs` and `s15r3_dots.py` in the session scratchpad.
- JS: every test file that imports item-drop, lighting, tap-pick or core/game.js, plus files that import their importers (inventory-menu, screen-states, interactions, doors, rooms, player, npc-needs, main): 129 files, 0 fail (item-drop 26, tap-pick 43, lighting-workstation-indicators 19 pass).
- Validator `--no-graph`: test_needs_sims, test_access_networks, test_access_work, test_access_social: 0 ❌ each, exit 0.
