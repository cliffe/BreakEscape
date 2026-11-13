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

- m1 (`lighting.js`): both marks have a 1 px dark ring (0x1a1c2c) round the dot, 6 px locked and 8 px open, whole-pixel, NEAREST. One texture: the dot white, the ring dark; the variant tint multiplies the ring too, which keeps it near-black (blue tint: 0x060f2c). The open mark breathes between 0.8 and 1 (`indicatorBreathe`); ransom screens keep their own breathe. Contrast composited on the PNGs at each anchor (`m1-ring-contrast.json`, `m1-ring-contrast-sheet.png`), worst of ring or dot against each screen pixel round the mark: pc 3.42 locked, 4.01 open trough; pc3 9.23, 4.76; pc5 2.79, 4.48; pc6 5.64, 3.34; pc7 4.06, 3.17; pc9 6.25, 3.71; pc11 2.48, 4.49; every `_locked` picture 4.16 locked, 7.81 open trough. The reviewer's worst was 1.19. pc5 and pc11 with the locked mark on the base picture (the password-session case) stay under 3:1.
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

## Handover

R2 fix round stopped at the call budget. Done: M1 root cause (Lena, by design, as on main), the door and room ranking, the stand-point same-room rule, m1, n1 to n4, tests, validator, sweep.

Open:
- **M1 pick-up in the north strip.** A drop at (44.5, 60) in `usb_room` cannot be picked up by a tap: no walkable feet point in `usb_room` has its sprite centre within 32 px of it. Two ways on: (a) in `dropPoint`, refuse (not just rank last) a cell that no own-room feet point can reach, using `sameRoomFrom` and the pathfinder, so the drop moves north to the feet (44.5, 48) cell, which is in reach from feet 52 and 60; or (b) let the arrival check count the facing-down reach. (a) is the smaller change. The `objectStandPoint` second pass (tap-pick.js) can go once (a) is in, or stay as a guard.
- Shots not taken: main-18, main-21, main3-14, main3-17, main3-21, main3-22 after shots; the south-gap drop (`s15f_drops.mjs` part B depends on part A's pick-up); n3 and n4 confirms live.
- Scripts: `s15f_lib.mjs`, `s15f_m1probe.mjs`, `s15f_drops.mjs`, `s15f_sweep.mjs`, `s15f_ring_contrast.py` in the session scratchpad.

Gotchas: the bridge's `interact` walks to an off-screen item's own point first, which in a shared strip lands in the other room; use a real `page.mouse.click` for tap proofs. `isObjectInInteractionRange` measures plain centre distance; `getInteractionDistance` (the E key) adds a facing offset.

Commits this round: 82468e97a (drop ranking, clamp, bodies), 583b17582 (dot ring and breathe), 892c4666a (rack hint, sockets), 111fd1dad and d298702e7 (stand point), and this log.

## Handover (build and R1)

Done. Commits: 294ec3b9b (dot, labels, drop, tests), 4fba8919c (sockets and wedge), e6ffd6cfa (wedge nudge), ef884d740 (this log), 9e190b1a9 (R1 fixes), 0ab221f91 (the R1 section of this log), 79cf24039 (wider drop search), and the ruling section of this log.
