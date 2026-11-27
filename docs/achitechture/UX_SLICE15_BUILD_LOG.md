# UX slice 15 build log: world marks and switches

Branch `build/ux-world`, from main de63f5900. Plan: slice 15 of `docs/achitechture/UX_GENERAL_RULES_AUDIT.md` (branch build/ux-audit), findings F34 and F38, answers d6 and d7, rulings in section (f).

## What changed

| Item | Source | Change | Files |
|---|---|---|---|
| Status dot centred | main3-21, F34, d7, Q11 ruling | `workstationIndicators` puts the locked and open dots at the PC sprite's centre (offsets 0, whatever the display size) instead of the box's top-right corner inset 5 px. The lock flash reads the same offsets, so it moves with the dot. `INDICATOR_INSET` removed. A room entry's own `indicators` keep their authored offsets. | `public/break_escape/js/systems/lighting.js` |
| Named confirm labels | main-21, d6, R4e | `confirm_action` takes optional `confirmLabel` and `cancelLabel`; a missing, empty or non-string label falls back to gameConfirm's Confirm or Cancel. Both are in the scenario schema. The X stays as it is (q99 is open). | `public/break_escape/js/systems/apply-actions.js`, `scripts/scenario-schema.json` |
| Switch confirms named | main-21, main-18, main3-14 | Every switch confirm in the three access test scenarios now names its choices: "Switch off" or "Switch on" with "Leave it"; the printer jams "Jam it" or "Clear it"; the breaker "Flip it"; the keystroke injector "Plug it in". 31 confirms (work 18, networks 5, social 8). | `scenarios/test_access_{work,networks,social}/scenario.json.erb` |
| Wall socket | main-21, d6 | Ian's socket (test_access_work, `ian_socket`) and Greg's (test_access_social, `f12_socket`) use the existing `wall_socket1` fixture on the back wall, between the whiteboard and the bookshelf, about 78 px from the PC (48 across, 61 up; corrected in R1, n4), instead of a `ups_cabinet1` stand-in in the middle of the room. Texts per d6: "Switch off the wall socket under Ian's desk? His PC loses power." and "Switch the wall socket back on?" (the first reworded in R1, m5, see below). | same |
| Wedge at the door | main3-17, F38, d12 short term | `store_wedge` is authored beside the stores doorway (x 2.25, y 7.3), right of the door gap, base clear of the wall, instead of (3,7). Tom walks to the prop, so he now walks to the door too. | `scenarios/test_access_work/scenario.json.erb` |
| Drop in front of the feet | R15, main3-12 | Belongs to slice 8 of the feedback round plan (art integration: "drop spot in front of the player's feet"), which waits on art. The code part is done here: `dropPoint` aims one pathfinding cell (8 px, `DROP_AHEAD_PX`) below the feet, then snaps to a walkable cell, so the item's bottom is below the feet and it draws in front. The USB stick sprite (art) is still slice 8. A magnet's table snap is unchanged. | `public/break_escape/js/systems/item-drop.js` |

Sync: no new player_state. `confirmLabel` and `cancelLabel` are scenario data; the socket, breaker and wedge globals already exist. A drop sends the same payload as before (only its x and y differ by a cell).

## Not built

- Plug and cable (q101, art). Hook point for d8: a `poweredBy: <socket id>` field on a device, drawn by a small module with a `syncRoom(roomId)` called from `core/rooms.js` next to `window.screenStates?.syncRoom(roomId)` and `window.postitMarks?.syncRoom(roomId)` (around line 1017). It finds the room's objects with `poweredBy`, looks the socket up in `room.objects`, and draws a 2 px stepped Phaser Graphics line from the device's foot to the socket, whole pixels, redrawn when a pushable device moves. Art: plug head 8x8; the `wall_socket1` fixture exists (back-wall view only; off/on and side-wall views are still art needs).
- The wedge beat in the lab (q102, slice 16).

## Tests

- `node --test test/js/lighting-workstation-indicators.test.mjs`: 15 pass (the corner test now checks offsets 0 at two display sizes).
- `node --test test/js/apply-actions-hint-give.test.mjs`: 9 pass (two new: labels passed, fallbacks for missing, blank and non-string labels; confirming runs onConfirm).
- `node --test test/js/item-drop.test.mjs`: 17 pass (the size test moved one cell; two new: the aim point is what is snapped, and a 16x16 drop's bottom and depth are past the feet).
- Every JS test file that imports a changed module or its importers (107 files): 1737 pass, 0 fail.
- Rails: `npc_workaround_h_test.rb` 34 runs, `sync_payload_size_test.rb` 6 runs, `capture_record_test.rb` 16 runs, 0 failures.
- Validator `--no-graph`: test_access_work, test_access_networks, test_access_social: 0 ❌ each, exit 0.

## Live proof

Keyless headless server on :3360 from this worktree, 1400x1000, setFPS(20) with fixed steps on; stopped afterwards. All games new, made with `tools/playtest/swap-scenario-game.rb` on host test_seating.

| Game | Scenario (start room) | Used for |
|---|---|---|
| 2487 | test_access_work (cable_room) | main-21: socket on the wall, closeup 3x, "Switch off" / "Leave it" confirm, PC dead (W6 task completes, Ian's bark), "Switch on" / "Leave it" confirm; `ian_pc_unplugged` true then false |
| 2488 | test_access_social (f12_room) | Greg's socket, same checks; `f12_pc_unplugged` true then false |
| 2496 | test_access_work (store_lobby) | main3-17: stores switch confirm, then Tom propped the door by himself after 81 s; the extinguisher shows beside the doorway |
| 2481 | test_access_networks (server_room) | main-18: "Flip it" / "Leave it" |
| 2482 | test_access_networks (workshop) | main3-14: "Switch on" then "Switch off", each with "Leave it" |
| 2493 | test_needs_sims (office) | main3-21: Amara left her desk after 51 s; open dot centred on her PC, 3x nearest zoom; Tom's PC's locked dot (global set for the shot) centred, 3x; main3-22: the coffee and copier sockets, 3x |
| 2503 | test_needs_sims (office) | R15: the parcel dropped with "Drop here" lands at (164, 228) with the feet at y 223, depth 235.5 against the player's 178.5, in front and visible |

Earlier games used to place the props and fix the crops: 2476, 2478 (not used), 2477, 2479, 2480, 2491, 2495.

Shots (lossless webp): session scratchpad `ux-shots/slice15/`, with a `report-<part>-<game>.json` per run. Extra pair: `social-f12-*`.

## Open points

- The dot is centred on the sprite as ruled. On a PC sprite with a tower beside the monitor (Amara's), the centre falls on the monitor's right edge, between monitor and tower. A per-sprite screen anchor would need a small table of screen boxes per PC texture; not done.
- The dot is the soft lighting glow (radial texture), as before; it is not a crisp pixel mark. Out of scope here.
- The test_needs_sims sockets (coffee machine, copier) and the server rack power switch in test_access_networks still act on a click with no confirm. R4e asks for one confirm language for physical switches; giving them a confirm with named labels is a small follow-up.
- The PCs in these test rooms stand on the floor, so "the wall behind the desk" is the back wall about a tile above the PC (room-dressing note, already deferred).
- Art still needed: wall socket off/on and side-wall views (16x16), plug head (8x8) if q101 is yes, and the USB stick sprite (slice 8).

## R1 fixes

Review: `docs/achitechture/UX_SLICE15_REVIEW_R1.md` (1 major, 5 minors, 4 nits). Fix commit 9e190b1a9. The first three open points above are closed by m1, m2 and m3.

| Finding | Change | Files |
|---|---|---|
| M1, m4, n3: a drop beside a desk landed inside it | `dropPoint` tries the aim (feet + 8), the feet, then one cell left and right of the feet, each as its own pathfinding cell with no wider snap. The first that is walkable, inside the room and clear wins. Clear (`dropSpotClear`): the item's box is inside the room rectangle, and no static or immovable body and no shown non-takeable prop drawn above the item (depth over `placedDepth`) covers more than a quarter of it (`DROP_COVER_LIMIT`). `dropClearance` gathers the room rectangle, bodies and props. When nothing is clear: the feet snapped to a walkable cell in the room, else the raw feet, never the raw aim. | `public/break_escape/js/systems/item-drop.js` |
| m1: the dot sat at the sprite centre | `SCREEN_ANCHORS` gives each workstation picture's screen centre as an offset from the sprite centre in source pixels, scaled by display size; an unknown picture falls back to 0. The lock flash reads the same offsets. | `public/break_escape/js/systems/lighting.js` |
| m2: the dot was a soft glow | The indicator mark is a whole-pixel square with stepped corners (4 px locked, 6 px open), made once with NEAREST filtering and drawn at whole-pixel positions; colour, size and the breathe or steady motion are kept. The screen glow stays soft. | same |
| m3: three switches with no confirm | Named confirms: "Switch off the coffee machine at the wall?" and "Switch off the photocopier at the wall?" ("Switch off" / "Leave it"); the rack power "Switch the server rack back on?" ("Switch on" / "Leave it") while `servers_offline`, else the hint "The server rack is on." | `scenarios/test_needs_sims/scenario.json.erb`, `scenarios/test_access_networks/scenario.json.erb` |
| m5, n4: "under Ian's desk" with no desk | "Switch off the wall socket by Ian's PC? It loses power." (and Greg's). The 40 px figure above corrected to about 78 px. | `scenarios/test_access_work/scenario.json.erb`, `scenarios/test_access_social/scenario.json.erb`, this log |
| n1: a label of spaces passed the schema | `"pattern": "\\S"` on `confirmLabel` and `cancelLabel`. | `scripts/scenario-schema.json` |
| n2: the wedge stands beside the doorway | Not changed here; see the note for slice 16 below. | |

Sync: no new player_state; a drop sends the same payload with a different x and y.

### R1 tests

- `node --test test/js/item-drop.test.mjs`: 20 pass, 0 fail.
- `node --test test/js/lighting-workstation-indicators.test.mjs`: 17 pass, 0 fail.
- Validator `--no-graph`: test_needs_sims, test_access_networks, test_access_work, test_access_social: 0 ❌ each.

### R1 live proof

Keyless headless server on :3362 from this worktree, 1400x1000 with scrollbars shown, setFPS(20) with fixed steps on; stopped by its PID afterwards. Games made with `tools/playtest/swap-scenario-game.rb` on host test_seating.

| Game | Scenario (start room) | Used for |
|---|---|---|
| 2546 | test_needs_sims (office) | First whole-office sweep and desk-gap drop (NPCs gathered round the cake before the late shot, so the drop was reshot in 2562); dot shots on pc6, pc8 and pc11 |
| 2562 | test_needs_sims (office) | Whole-office sweep and desk-gap drop (reported below); coffee and copier socket confirms |
| 2547 | test_access_networks (server_room) | Rack-on hint, breaker "Flip it", rack "Switch on" confirm; `servers_offline` false, true, false |
| 2548 | test_access_work (cable_room) | Ian's socket: "Switch off the wall socket by Ian's PC? It loses power." then "Switch the wall socket back on?"; `ian_pc_unplugged` true then false |
| 2549 | test_access_social (f12_room) | Greg's socket, same wording; `f12_pc_unplugged` true then false |

- Desk gap (feet at 62, 164, the review's spot): the cake lands at (60.5, 164.5), depth 205.7, with nothing drawn over it; at 3x it shows whole in front of the desk edge.
- Whole-office sweep (1144 walkable foot cells, 16x16 item, the review's measure: a prop at least 24 px wide drawn above the item covering half its box or more): 180 drops are still drawn over, against 255 with the R1 aim and 228 before slice 15. 0 land outside the room, 0 on an unwalkable cell, 0 at the raw aim. 700 land at the aim, 318 at the feet, 126 one cell to the side.
- All 180 remaining are foot cells where the player's own feet are behind the same prop (the walk-behind effect: standing on a desk top or behind a chair, the bookcase, the activity board, the copier or the coffee machine), so the item is hidden exactly as the player is, and none of the four candidates is clear. By prop: desks 97, chairs 23, bookcase 16, activity board 16, copier 9, coffee machine 6, PCs 11, laptop 2. A wider search would find a clear cell for most of them (15 at one cell, diagonally; 69 at two; 52 at three; 44 none within three), at the cost of a drop landing away from the player. Ruled on below.
- Dots: on pc6 (Tom's), pc8 (Amara's) and pc11 (Sanjay's) the locked dot sits on the middle of the monitor screen as a crisp stepped square at 3x (NPCs and their overlays hidden for the shots). On pc6's bright cyan screen the blue dot has less contrast than on the other two.
- Confirms: coffee and copier sockets, the rack power and both wall sockets show their named labels in the skinned dialog; the rack with the network up shows the "Server rack power: The server rack is on." hint and no dialog.

Shots and per-run JSON: session scratchpad `ux-shots/slice15-r1fix/`.

### R1 ruling: wider drop search

Orchestrator ruling on the 180: widen the search to two cells and accept what is still hidden as the walk-behind case (the player is hidden by the same prop, the intended convention). Commit 79cf24039.

- `dropPoint` now tries, after the aim, the feet and the two side cells, the four diagonal cells, then the 16 cells two steps out (`dropRingOffsets`). Within each ring: in front (south) before level before behind, then nearer, then further south, then the side the player faces (`facing`, from `player.direction`; left first when neither). Every guard stays: each candidate is its own walkable cell, inside the room and clear; nothing clear falls back to the snapped feet, else the raw feet, never the raw aim.
- Tests: `item-drop.test.mjs` 22 pass (two new: the ring order with and without a facing side; a diagonal, a cell two steps out, the facing side, a diagonal outside the room skipped). Every test file importing item-drop or one of its importers (87 files): 1543 pass, 0 fail.
- Live: new game 2577 (test_needs_sims, office) on :3362, same server settings, stopped by its PID. The sweep (no facing, so left first) over 1144 walkable foot cells: 96 drops still drawn over, down from 180. 709 land at the aim, 200 at the feet (including the walk-behind fallbacks), 124 one cell to the side, 35 on a diagonal, 76 two steps out; 0 outside the room, 0 on an unwalkable cell, 0 at the raw aim. The desk-gap drop (feet at 62, 164) still lands at (60.5, 164.5) with nothing drawn over it.
- Residual 96, all with the player's own feet behind the same prop (walk-behind, accepted): desks 76, activity board 6, bookcase 4, Tom's PC 3, chair 3, copier 2, laptop 2.

### Note for slice 16

- The wedge (`store_wedge`) should stand against the open door leaf so it reads as holding the door, not beside the doorway (review n2).

## R2 fixes

Against `UX_SLICE15_REVIEW_R2.md` (b0e20f00a).

### M1: the north doorway strip

Root cause of the vanishing stick: Lena. `kit_usb` carries `needsTag: dev_usb`, and Lena in `usb_room` has an interest in `dev_usb` (the U1 beat: "Drop Lena's storage stick here ... Lena takes it to her PC"). Instrumented on game 2626 (every NPC event, `destroy` and `setVisible(false)` of the sprite): `item_dropped:kit_usb`, then `npc_left_post:lena`, then `npc_picked_up:kit_usb` 3 s later, and she carries it to her PC. Nothing in the drop, door or room code removes it. A reload brings it back because the server keeps a drop until an NPC uses it up (npc-needs.js consumeHeld), not while she holds it; she collects it again. `post_usb`, which no one in `usb_room` wants, stays. Main shows the same: with main's item-drop.js (feet drop, checked out locally in this worktree only, then restored) on game 2636, the stick lands at (44.5, 44) and Lena collects it 2.3 s later.

What the strip does break, found while proving the pick-up with a real mouse click (games 2655, 2656, 2667): the drop at (44.5, 60) belongs to `usb_room` by the same-room rule, but a tap on it walks the player to a stand point south of it, in the lobby, where the use is refused. The bridge's `interact` hides this differently: it walks to the item's own point first, which is also lobby, and reports `different-room`.

Changes:
- `item-drop.js` `dropPoint`: a candidate whose box touches `opts.avoid` (door sprites of the loaded rooms, other loaded rooms' rectangles that touch this room; `dropClearance` gathers them) is skipped on a first pass and taken only when nothing else is clear. From feet in the north strip every candidate in reach touches the lobby, so that drop still lands at (44.5, 60).
- `tap-pick.js` `objectStandPoint`: a new `sameRoom` rule (game.js passes `sameRoomFrom` at the stand point), so a stand point only counts when the feet there are in the object's room; and, with that rule, a second look north of the object within the full range. Live, a click from the lobby now no longer counts a lobby stand point as usable, but the strip item at y 60 is in reach (plain centre distance, `isObjectInInteractionRange`) of no walkable feet point in `usb_room`, so the walk still ends in the lobby and nothing is picked up. **Open**, see the handover.

### m1, n1 to n4

- m1 (`lighting.js`): both marks have a 1 px dark ring (0x1a1c2c) round the dot, 6 px locked and 8 px open, whole-pixel, NEAREST. One texture: the dot white, the ring dark; the variant tint multiplies the ring too, which keeps it near-black (blue tint: 0x060f2c). The open mark breathes between 0.8 and 1 (`indicatorBreathe`); ransom screens keep their own breathe. Contrast composited on the PNGs at each anchor (`m1-ring-contrast.json`, `m1-ring-contrast-sheet.png`), for each screen pixel round the mark, the better of ring or dot; the worst over those pixels: pc 3.42 locked, 4.01 open trough; pc3 9.23, 4.76; pc5 2.79, 4.48; pc6 5.64, 3.34; pc7 4.06, 3.17; pc9 6.25, 3.71; pc11 2.48, 4.49; every `_locked` picture 4.16 locked, 7.81 open trough. The reviewer's worst was 1.19. pc5 and pc11 with the locked mark on the base picture (the password-session case) stay under 3:1.
- n1: the last fallback is shifted so its box lies inside the room (`clampIntoRoom`). The sweep's outside count went from 144 to 0.
- n2: `dropClearance` keeps only static and immovable bodies that touch the room grown by 16 px: 49 to 95 per room in test_access_work, from 980.
- n3: "Switch on" at the rack power adds the hint "The rack powers up. The server network is back." (not re-shot live, see the handover).
- n4: the coffee, office copier and kitchen copier sockets switch back on with a named confirm worded like Ian's ("Switch the coffee machine back on at the wall?", "Switch on" / "Leave it"); the kitchen copier socket had no confirm at all and was one-way. Not re-shot live.

### R2 tests

- `item-drop.test.mjs` 25 pass (new: the fallback clamp; door and room rectangles ranked last; `dropClearance` lists doors and touching rooms and only nearby bodies). `lighting-workstation-indicators.test.mjs` 18 pass (new: ring pixels for 4 and 6, breathe floor, texture size). `tap-pick.test.mjs` 43 pass (new: a strip object is approached from its own room; no rule, no change).
- Every test file importing item-drop, lighting, tap-pick, game.js or their importers, plus npc-printer-power: 40 files, 596 pass, 0 fail.
- Validator `--no-graph`: test_needs_sims, test_access_networks, test_access_work, test_access_social: 0 ❌ each, exit 0.

### R2 live proof

Keyless headless server on :3364 from this worktree, 1400x1000 with scrollbars shown, setFPS(20) with fixed steps on. New games via `tools/playtest/swap-scenario-game.rb` on host test_seating, test_access_work with --unlock-all: 2626 (M1 trace), 2636 (main's drop code), 2638 (sweep), 2639, 2640, 2653 to 2656, 2667 (drop and pick-up runs). Shots and reports: session scratchpad `ux-shots/slice15-final/`.
- The reviewer's 23-room sweep on game 2638, 77,964 calls: drops whose box reaches into the next room while the feet do not, 1302 to 3 (hall_c, one foot cell); on a door sprite 1902 to 1668 (feet already in a door strip); outside the room 144 to 0; unwalkable 0; furthest 23 px; `dropPoint` 0.1 ms at the 99th percentile, 0.6 ms at most; `dropClearance` 0.2 ms median.
- `post_usb` dropped in the north strip stays visible in `usb_room` after a walk into the lobby and back (`m1-a-north-strip-drop-3x`, `m1-a-north-strip-after-walk-3x`).

## R2 fixes, final

Finishes the R2 round from the handover below.

### M1: a strip drop is picked up from its own room

- `item-drop.js`: new `pickupReachable(cell, deps)`. A cell counts only when some walkable feet cell whose feet are in the drop's room (`roomIdAtFeet`, the player's half height) has the player's sprite centre (feet minus the foot offset, 31 px) within 30 px of the drop centre: the arrival check's plain distance (32) with a 2 px margin. `dropPoint` takes it as `opts.reachable` and refuses a candidate it rejects (a hard refusal, before the door ranking). The final fallback, the feet cell, is not checked. `dropInventoryItem` builds the rule from the pathfinder and `window.interactionWalls.roomIdAtFeet`.
- In the north strip (feet 47.9, 48.3 in `usb_room`) the aim (44, 60) and the feet cell (44, 52) are both refused: the feet cell's nearest own-room stand point puts the sprite centre 31 px away, one past the margin. The drop takes the up-right diagonal and lands at (52.5, 44), not the (44.5, 48) the handover expected. I kept the margin, since a real click picks this spot up.
- `tap-pick.js`'s second pass (north of the object, within the full range) stays as a guard.
- Unit test (`item-drop.test.mjs`, 26 pass): a strip where the cell below the last own-room feet row is in reach only from the next room. The aim is refused and the feet cell taken. With nothing reachable, the drop falls back to the feet cell. With no lookups, every cell counts.

### m1: dot contrast

The locked mark is filled 0x7ab4ff (`dotColor`, the mark only); its light on the light map stays 0x3d8bff. A separate untinted ring would not help: the failing screen pixel is a mid tone, where both the near-black ring and the old blue fall under 3:1. Only a lighter fill lifts it. `s15f_ring_contrast.py` (session scratchpad, now with the new blue), for each screen pixel round the mark, the better of ring or dot; the worst over those pixels (raw PNGs, not the rendered game; see "Final fixes" for rendered pixels):

| Picture | Locked | Open | Open trough (0.8) |
|---|---|---|---|
| pc | 5.29 | 7.07 | 4.01 |
| pc3 | 8.91 | 8.44 | 4.76 |
| pc5 | 3.16 | 6.01 | 4.48 |
| pc6 | 5.45 | 5.16 | 3.34 |
| pc7 | 3.92 | 4.13 | 3.17 |
| pc9 | 6.04 | 5.72 | 3.71 |
| pc11 | 3.56 | 6.28 | 4.49 |
| pc8 | 5.22 | 9.94 | 7.01 |
| every `_locked` picture | 6.44 | 12.26 | 7.81 |

Every mark is at 3:1 or more; the lowest are pc5 locked (3.16) and pc7 open trough (3.17). Test: `lighting-workstation-indicators.test.mjs` 19 pass (new: the mark takes `dotColor`, the light keeps `color`, the open mark takes its colour).

### R2 final tests

- Every test file that imports item-drop, lighting or game.js, plus the R2 list: 41 files, 636 pass, 0 fail.
- Validator `--no-graph`: test_needs_sims, test_access_networks, test_access_work, test_access_social: 0 ❌ each, exit 0.

### R2 final live proof

Keyless headless server on :3365 from this worktree, 1400x1000 with scrollbars shown, setFPS(20) with fixed steps on, stopped by its PID. New games via `tools/playtest/swap-scenario-game.rb` on host test_seating: 2675 and 2678 (test_access_work, unlock-all: drops, sweep), 2676 (test_needs_sims: sockets, dots), 2677 (test_access_networks, server_room: rack, breaker), 2692 (test_access_work, cable_room: main-21), 2693 (store_lobby: main3-17), 2694 (test_access_networks, workshop: main3-14). Shots and reports: session scratchpad `ux-shots/slice15-final/`; scripts `s15g_*.mjs`.

- **North strip, real mouse click** (2675, `post_usb`): dropped from feet (47.9, 48.3), it lands at (52.5, 44) in `usb_room`. It stays through a walk into the lobby and back. A `page.mouse.click` on it from feet (44.4, -21.6) walks the player to (44, 45.9), still in `usb_room`, and picks it up (`final-north-strip-drop-3x`).
- **Sweep, all 23 rooms loaded** (2678), three facings, 78,018 calls, with the game's rule: drops from feet standing in their own room that no own-room feet point can pick up (plain 32 px, no margin): **0 of 62,817**. The other 1,512 unpickable drops all come from feet cells inside the rectangle that `roomIdAtFeet` puts in the neighbouring room (its walk-behind strip), where the game drops into that other room. Unwalkable 0, outside the room 0, into the next room with the feet not 3 (hall_c, as before), furthest 23 px, `dropPoint` 0.3 ms at the 99th percentile and 2.5 ms at most (`report-final-sweep-2678.json`).
- **South gap** (2675): with the south door closed, feet in its sprite are refused ("You are in a doorway", inventory-menu.js, on main). Walking on opens the door, and doors.js destroys an opened door's sprite and removes it from `doorSprites`. From feet (48.7, 290.7) in the open gap the drop is then allowed and lands at (52.5, 300), drawn on the black gap. A real click from (149, 200) walks there and picks it up (`final-south-gap-drop-3x`). **Open**, see the handover.
- **n3** (2677): breaker "Flip it", rack "Switch on", then a second trip and a second "Switch on". Both times the hint "The rack powers up. The server network is back." shows and `servers_offline` goes false. A click with the rack on shows "The server rack is on."
- **n4** (2676): the coffee and office copier sockets offer "Switch off" (global true, off hint). The next click offers "Switch the ... back on at the wall?" with "Switch on" / "Leave it" (global false, on hint), and the click after offers off again. **The kitchen copier socket could not be used live**: the bridge's interact and a real click both end at feet (-44, 199), 39.6 px from the socket (plain distance), and nothing opens. The socket sits on the kitchen's east wall column (x -40 to -16 unwalkable). The only kitchen feet in reach are near (-44, 207 to 265), and the walk does not go there. Not fixed, see the handover.
- **After shots** (all at 1400x1000): `main-18-breaker-confirm`; `main-21-a` to `-e` (Ian's socket both ways); `main3-14-a`, `-b` (bench power); `main3-17-a` to `-c` (stores switch, wedge; 3x closeup); `main3-21-a` (office dots), `main3-21-b-dot-amara_pc-3x` (the open mark on a real away owner), `main3-21-c-locked-dot-tom_pc-3x` (the locked mark in its new blue); `main3-22-office_coffee_socket-3x`, `main3-22-office_copier_socket-3x`. The contrast sheet is `contrast-after/m1-ring-contrast-sheet.png` (10x), and the before sheet is in `contrast-before/`.

## Final fixes (review R3)

From `UX_SLICE15_REVIEW_R3.md` (0 blockers, 0 majors, 2 minors, 2 nits). All four fixed.

- **m1, marks under the dark-room glows: fixed.** `lighting.js` has a new `emitterGlowDepth(indicator, above, objDepth)`: an indicator mark is at `LIGHT_DEPTH + 2`, above every glow (`above` glows stay at `LIGHT_DEPTH + 1`, others just in front of their object). Live, the mark is at 100002 and the highest other glow at 100001 in the switched-off office (205.56 lit), with no glow over the mark in either. Measuring the rendered pixels also showed that pc5's open mark in the lit office fell to 2.96:1 at the old breathe trough (0.8), so `INDICATOR_BREATHE_FLOOR` is now 0.85. Test: `lighting-workstation-indicators.test.mjs` (20 pass; new: the mark is above a dark-room screen glow, a lit-room glow and an `above` variant, and the render pass sets depth through the helper; the floor is 0.85).
- **m2, kitchen copier socket: fixed.** `test_needs_sims` `kitchen_copier_socket` moves from y 6.4 to y 7.4, on the east wall beside the copier, level with the walkable column at its side. Real mouse clicks only, from the kitchen's middle (game 2767): one click on the socket walks the player to feet (274.3, 259.5), 29.9 px from it, and opens "Switch off the kitchen copier at the wall?"; a click on "Switch off" sets `kitchen_copier_off` with the off hint. The next click on the socket opens "Switch the kitchen copier back on at the wall?"; "Switch on" clears it with the on hint.
- **n1: fixed.** The `pickupReachable` comment now states its rule (plain centre distance within range less margin, 30 px) and how it compares with `isObjectInInteractionRange`: stricter than `reachX` on purpose, with no wall check and no check that the stand point can be walked to from the player.
- **n2: fixed.** The two contrast lines above now say "for each screen pixel round the mark, the better of ring or dot; the worst over those pixels".
- Backlog: the reviewer's side note (a door click from across the lobby in test_access_work stopping 18 px from the post_room door, door closed) is in `docs/IDEAS_BACKLOG.md`, dated, marked not yet checked on main.

### Rendered contrast

Measured on screenshots of the game, the light map and glows under the mark, with the reviewer's script (`s15r3_dots.py`, and `s15z_precise.py` for more decimals and the exact trough). One office workstation takes each picture; the locked mark is the password-session case (locked mark on the base picture), the open mark is caught at its breathe trough (alpha 0.85 to 0.86, then recomposited at exactly 0.85). Measure: for each screen pixel round the mark, the better of ring or dot; the worst over those pixels.

No test scenario with workstations starts with a dark room (test_behind_wall_fade has dark rooms, but no workstations), so the dark run switches the office off with `lightingSystem.switchOff('office')`, as the reviewer did (level 0 throughout).

| Picture | Lit, locked | Lit, open (0.85) | Dark, locked | Dark, open (0.85) |
|---|---|---|---|---|
| pc | 3.31 | 3.27 | 15.01 | 8.17 |
| pc5 | 3.91 | 3.03 | 13.54 | 7.71 |
| pc6 | 7.75 | 4.83 | 16.29 | 9.72 |
| pc7 | 5.26 | 3.37 | 14.70 | 7.92 |
| pc11 | 3.58 | 3.55 | 13.93 | 7.45 |

Every mark is at 3:1 or more. Before the floor change (games 2768 and 2769, trough 0.8): lit pc5 open 2.96, everything else 3.10 or more; lit pc locked was 3.17 on that run and 3.31 on this one (the screen glow's flicker moves the pixels round the mark). The dark run before this round, on the reviewer's measure, was 1.24 to 2.36. In the dark office the locked dot now renders #7ab4ff with a #0c142c ring, as in a lit room.

### Final tests and proof

- Tests: every test file that imports lighting.js or item-drop.js or reads test_needs_sims, plus the R3 reviewer's list: 40 files, 645 pass, 0 fail.
- Validator `--no-graph` on test_needs_sims: 0 ❌, exit 0.
- Keyless headless server on :3367 from this worktree, 1400x1000 with scrollbars shown, setFPS(20) with fixed steps on, stopped by its PID. New games via `tools/playtest/swap-scenario-game.rb` on host test_seating, all test_needs_sims: 2766 (kitchen geometry, socket at its old place), 2767 (start kitchen: m2 clicks), 2768 and 2769 (lit and dark marks, old floor), 2786 and 2787 (lit and dark marks, final), 2788 (main3-21, main3-22).
- Shots (session scratchpad `ux-shots/slice15-final/`): `contrast-r3/final-m1-{lit,dark}-{pc,pc5,pc6,pc7,pc11}-{locked,open}-3x.webp`, `contrast-r3/final-m1-{lit,dark}-office.webp`, `contrast-r3/dots-{lit,dark}-sheet.png` with the contrast JSON; `final-m2-a-kitchen-socket-3x`, `final-m2-b-off-confirm`, `-c-switched-off`, `-d-on-confirm`, `-e-switched-on`; `main3-21-a` to `-c` and `main3-22-*` refreshed (game 2788). Scripts: `s15z_*.mjs`, `s15z_precise.py`.

Commits: 9a4eebebd (mark depth, n1 comment), 27221b637 (kitchen socket), 04d5eac2b (breathe floor 0.85), and this log with the backlog line.

## Handover (R2 final)

Done: M1 reachability (pickupReachable, test, live click, sweep), m1 contrast (dotColor, test, table), n3 live, n4 office sockets live, after shots, tests, validator. Commits: 34babc840 (reachability), 14a2e310e (dot fill), and this log.

Open:
- **South gap after the door opens.** Opened doors leave `doorSprites`, so `dropBlockedReason` and the door ranking stop seeing the gap, and a drop from feet in the gap lands on the black gap (it can still be picked up). One way on: count opened doorways too, from door-gaps.js's provider (`calculateDoorPositionsForRoom`). The catch: the same rule would refuse the north-strip drop (feet 48.3 lie inside the lobby's north door rectangle, y 0 to 64) with "You are in a doorway". That is a design call for the orchestrator.
- **Kitchen copier socket unreachable** (test_needs_sims, `kitchen_copier_socket` at x 9.05, y 6.4): neither the tap walk nor the bridge's approach reaches a stand point in range. Either move the socket (for example y 7.4, so feet at (-44, 236) are level with it) or have the stand-point search find the band below it. I did not check whether main behaves the same.

## Handover (R2 fixes)

R2 fix round stopped at the call budget. Done: M1 root cause (Lena, by design, as on main), the door and room ranking, the stand-point same-room rule, m1, n1 to n4, tests, validator, sweep.

Open:
- **M1 pick-up in the north strip.** A drop at (44.5, 60) in `usb_room` cannot be picked up by a tap: no walkable feet point in `usb_room` has its sprite centre within 32 px of it. Two ways on: (a) in `dropPoint`, refuse (not just rank last) a cell that no own-room feet point can reach, using `sameRoomFrom` and the pathfinder, so the drop moves north to the feet (44.5, 48) cell, which is in reach from feet 52 and 60; or (b) let the arrival check count the facing-down reach. (a) is the smaller change. The `objectStandPoint` second pass (tap-pick.js) can go once (a) is in, or stay as a guard.
- Shots not taken: main-18, main-21, main3-14, main3-17, main3-21, main3-22 after shots; the south-gap drop (`s15f_drops.mjs` part B depends on part A's pick-up); n3 and n4 confirms live.
- Scripts: `s15f_lib.mjs`, `s15f_m1probe.mjs`, `s15f_drops.mjs`, `s15f_sweep.mjs`, `s15f_ring_contrast.py` in the session scratchpad.

Gotchas: the bridge's `interact` walks to an off-screen item's own point first, which in a shared strip lands in the other room; use a real `page.mouse.click` for tap proofs. `isObjectInInteractionRange` measures plain centre distance; `getInteractionDistance` (the E key) adds a facing offset.

Commits this round: 82468e97a (drop ranking, clamp, bodies), 583b17582 (dot ring and breathe), 892c4666a (rack hint, sockets), 111fd1dad and d298702e7 (stand point), and this log.

## Handover (build and R1)

Done. Commits: 294ec3b9b (dot, labels, drop, tests), 4fba8919c (sockets and wedge), e6ffd6cfa (wedge nudge), ef884d740 (this log), 9e190b1a9 (R1 fixes), 0ab221f91 (the R1 section of this log), 79cf24039 (wider drop search), and the ruling section of this log.
