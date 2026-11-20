Counts: blockers 0, majors 1, minors 1, nits 4

# UX slice 15 review, round 2 (world marks and switches)

Branch `build/ux-world` at 2a85842a0. Read against `UX_SLICE15_REVIEW_R1.md`, the build log's "R1 fixes" and "R1 ruling" sections, commits 9e190b1a9, 0ab221f91, 79cf24039 and 2a85842a0, the UI design language and the walk-behind convention. Orchestrator rulings taken as given: the 96 hidden drops left in the office are walk-behind cases, and the wedge waits for slice 16.

## Findings

### Major

**M1. `public/break_escape/js/systems/item-drop.js:224-231` (with the take path, cause not found): an item dropped in the north doorway strip disappears when the player goes to pick it up, and only a reload brings it back.**
What breaks: in test_access_work (game 2585) the player opens the lobby's north door, stands in `usb_room` at feet (47.9, 48.3) and drops `kit_usb`. It lands at (44.5, 60), saved under `usb_room`, inside the 64 px strip where `usb_room`'s floor overlaps the lobby's back wall and the door gap. Both rooms' rectangles contain the strip. Seen twice:
- The bridge's `interact('kit_usb')` walked the player out through the lobby (`room_entered:lobby`) and reported success. The item was then in no room's `objects` and not in the inventory, and no inventory `add` request was sent.
- After a reload the item was back in `usb_room` (top-left 38, 56). After a short walk inside `usb_room` to (48, 44), it was gone again before any click (`unknown-entity:kit_usb`).
A `post_usb` dropped live at the same spot survived a walk into the lobby and back, so the trigger is not simply a room change. I did not find the code that removes the sprite. Neither dropPoint nor the 8 px aim is shown to cause this: the old drop at the feet also lands in that strip. Still, dropPoint is what puts items there. The sweep (all 23 rooms loaded, three facings) has 63 to 138 drops per room that overlap a door sprite, and up to 96 per room whose box reaches into the next room's rectangle while the feet do not. In the south door gap (lobby feet (47.9, 283)) the item lands at (44.5, 300), drawn on the black gap and not on the floor (`door-south-gap-low-3x.webp`).
Fix: first reproduce with `s15r2_north.mjs` and `s15r2_north3.mjs` (session scratchpad), log every `destroy` and every `room.objects` delete for the item, and fix whatever removes it. The candidates are the room-object rebuild for the shared strip, doors.js door-sprite and wall-tile removal under a door, and the take path's room check. Then in `dropPoint`, rank down (skip on the first pass) any candidate whose box overlaps a door gap (`room.doorSprites`) or another loaded room's rectangle. Fall back to such a cell only when nothing else is clear. Unit test: with a door rectangle just south of the feet, the drop lands on a side or diagonal cell. Live proof: the same north-strip drop and pick-up, plus the south-gap drop on the floor.

### Minor

**m1. `public/break_escape/js/systems/lighting.js:111-112`, `:491-500` and `:1276`: the dots have too little contrast on bright and blue screens.**
What breaks: on its real locked picture (`pc6_locked`, `pc8_locked`, `pc11_locked`, game 2583) the locked dot sits on the cream padlock and reads well (`dots-montage.png`, top row). The builder's pc6 worry came from forcing the global, which keeps the open picture. That state is real, though: screen-states keeps the base picture while the player holds a password session at a locked PC, and leaves a PC with `spriteVariants` alone. There the blue mark on cyan or blue screens nearly vanishes (`dots-trough-and-locked-on-base.png`, bottom row: pc6, and pc11 worst). The open dot breathes down to alpha 0.5, and at that low point it washes out on light screens (top row of the same shot: pc6). WCAG contrast of the mark against the screen colour under it (from the PNGs):

| Screen | Locked blue | Open, full | Open, alpha 0.5 |
|---|---|---|---|
| pc, pc_desktop (pink) | 1.64 | 1.79 | 1.35 |
| pc3 (pale cyan) | 2.30 | 1.28 | 1.13 |
| pc5 (sky blue) | 1.44 | 2.05 | 1.40 |
| pc6 (cyan) | 1.89 | 1.56 | 1.20 |
| pc7 (blue) | 1.20 | 2.46 | 1.59 |
| pc9 (pale blue) | 1.79 | 1.64 | 1.29 |
| pc11 (blue stripes) | 1.19 | 3.51 | 1.95 |
| pc4, pc8, pc12 (dark) | 3.2 to 4.5 | 9 to 13 | 3.6 to 4.4 |

Fix: give both marks a 1 px dark outline (for example 0x1a1c2c, as a separate untinted ring texture drawn under the tinted dot, so the tint stays on the dot only). That makes the locked mark 6 px and the open mark 8 px across, both still whole-pixel and NEAREST. Hold the indicator breathe at or above 0.8 (for example `k = 0.9 + 0.1 * sin`), or swap it for a two-step whole-alpha pulse. Node test for the ring pixels; 3x shots on pc3, pc6, pc11 and pc8, locked on the base picture and open at the low point of the breathe.

### Nits

**n1. `public/break_escape/js/systems/item-drop.js:230-231`: the last fallback tests only the centre against the room, so the box can stick out.** From a foot cell in the top strip (office (228, 4); in each test_access_work room, two cells at y 4 above its top edge) the drop stays at the feet and its 16 px box starts 4 px above the room rectangle (`report-sweep-2583.json`, `report-sweep-2585.json`: `outsideList`). Those cells were not reached on foot (walks stop at the back wall), so this is a guard and not a seen bug. Fix: clamp the fallback box into `roomRect` (shift the centre by the overhang), and add a unit test.

**n2. `public/break_escape/js/systems/item-drop.js:247`: `dropClearance` collects every static body in the world, not just the room's.** With all 23 test_access_work rooms loaded that is 980 rectangles per drop. The cost is still small: `dropClearance` takes 0.2 ms median and 0.8 ms at most, and `dropPoint` takes under 0.1 ms median, 0.2 ms at the 99th percentile and 4.2 ms at most, over 77,967 calls. Fix when convenient: skip bodies that do not overlap `roomRect` grown by two cells.

**n3. `scenarios/test_access_networks/scenario.json.erb:557-560`: "Switch on" gives no feedback after the first time.** The rack confirm sets `servers_offline` false and completes `n6_repair`, so the first time shows only the task toast. After a second breaker trip, "Switch on" shows nothing, while "Flip it" always says what happened. Fix: add `{ "type": "hint", "title": "Server rack power", "message": "The rack powers up. The server network is back." }` to `onConfirm`. The rack-on hint does not appear straight after confirming, which is correct (checked below).

**n4. `scenarios/test_needs_sims/scenario.json.erb:247-264` and `:315-334`: the coffee and copier sockets switch off only, while Ian's and Greg's sockets (the same `wall_socket1` fixture) switch both ways.** R4e asks for one switch language. Once off, these two show a hint and offer no way back. Fix: add a second `confirm_action` guarded by the off global ("Switch the coffee machine back on at the wall?", "Switch on" / "Leave it") that sets the global false, as the cable_room socket does.

## What checks out

- **dropPoint guards** (sweeps over every walkable foot cell, facings none, left and right): test_needs_sims office, 1144 cells; test_access_work, all 23 rooms, 77,967 calls. Every drop lands on a walkable cell, and 0 land at the raw aim. The box is inside the room except for the n1 fallback. The furthest drop is 23 px from the feet (the two-step ring). Facing changes only the order among side cells; no facing breaks a guard. Drops whose box touches a wall-layer tile come from foot cells in the walk-behind strip (y under 32), or within 12 px of the south wall, where R1's shots showed the item in front on the wall base. About 50 foot cells per room land one ring away across a thin static strip (a desk's or chair's collision edge). That is within reach, and the player picks it up from either side.
- **Doorways, walking only** (game 2585): from the lobby's west doorway, the drop lands at the feet in the gap ((20.5, 84) and (12.5, 84)) or on the hall side under `hall_a` ((-11.5, 84)), and each picks up again. Closed side doors stop the walk at x 41 and 279, so the unreachable side-wall cells the R1 sweep found stay unreachable. North and south gaps: see M1.
- **dropRingOffsets**: the four diagonals, then the 16 cells two steps out; front before level before behind, then nearer, then further south, then the facing side. This matches the doc comment and the ruling.
- **SCREEN_ANCHORS** (`anchors-sheet.png`: every listed picture, its `_locked` partner, plain and mirrored, with the 4 px and 6 px boxes as drawn): each anchor sits on the screen's centre within a pixel, for all 13 keys. Each `_locked` PNG has the same size as its base, so stripping `_locked` is right. `emitterKey` reads `_screenBaseKey`, so a PC that starts locked still finds its base. flipX mirrors only x, which is correct for centre-origin sprites. Live, the dot's top-left matches the table: pc8 (229, 120) + (-6.5, -4.5) gives (221, 114); pc6 gives (84, 157); pc11 gives (86, 117). Scenario workstations use `pc`, `pc_desktop`, `pc3` and the test PCs, all listed. An unlisted picture (a laptop, `pc*_ransomware`) falls back to the centre, as documented.
- **Crisp mark**: the 4 px and 6 px stepped squares draw at whole pixels with NEAREST filtering, and the soft screen glow is separate.
- **Named confirms both ways** (game 2583: coffee, copier; game 2584: breaker, rack): "Leave it" leaves each global as it was. "Switch off" sets `office_coffee_off` and `office_copier_off` true with their hint, and a second click shows the hint with no dialog. "Flip it" sets `servers_offline` true. The rack's "Leave it" keeps it true; "Switch on" sets it false. With the rack on, a click shows "The server rack is on." with no dialog. Straight after "Switch on", that hint does **not** appear: `confirm_action` runs `onConfirm` after the promise resolves, and the later hint in the same list was evaluated earlier, with `servers_offline` still true. Only the N6 task toast shows. The dialogs keep the skinned frame, pixel font and named buttons (`confirm-office_coffee_socket-accept.webp`). Ian's and Greg's socket wording ("by Ian's PC") was not re-run live this round; the text is unchanged since the builder's proof in games 2548 and 2549.
- **Schema and engine agree**: `minLength: 1` plus `pattern: "\\S"` refuses an empty or all-space label. The engine (`apply-actions.js:414`) falls back to Confirm or Cancel on exactly those values. The validator uses the json-schema gem, which applies `pattern`; I did not run a blank-label fixture.
- **No new player_state**: the round's diff touches no synced field. A drop sends the same payload (room, x, y) as before.

## Verification

- Server: keyless, headless, port 3363 from this worktree; setFPS(20) with fixed steps on; browser with scrollbars shown, 1400x1000. Stopped by its PID afterwards.
- New games via `tools/playtest/swap-scenario-game.rb` on host test_seating: 2583 (test_needs_sims: sweep, dots, coffee and copier confirms), 2584 (test_access_networks, server_room: breaker and rack), 2585 (test_access_work, unlock-all: all-room sweep, doorway drops, M1), 2586 (test_access_social, f12_room: made, not used).
- Shots and per-run JSON: session scratchpad `ux-shots/slice15-r2/`. Scripts: `s15r2_*.mjs` and `s15r2_anchors.py` in the session scratchpad.
- JS: every test file that imports item-drop, lighting, table-drop, inventory-menu, screen-states or core/game, directly or through a chain: 50 files, 655 tests, 0 fail.
- Validator `--no-graph`: test_needs_sims, test_access_networks, test_access_work, test_access_social: 0 ❌ each, exit 0.
