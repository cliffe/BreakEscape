# UX slice 15 build log: world marks and switches

Branch `build/ux-world`, from main de63f5900. Plan: slice 15 of `docs/achitechture/UX_GENERAL_RULES_AUDIT.md` (branch build/ux-audit), findings F34 and F38, answers d6 and d7, rulings in section (f).

## What changed

| Item | Source | Change | Files |
|---|---|---|---|
| Status dot centred | main3-21, F34, d7, Q11 ruling | `workstationIndicators` puts the locked and open dots at the PC sprite's centre (offsets 0, whatever the display size) instead of the box's top-right corner inset 5 px. The lock flash reads the same offsets, so it moves with the dot. `INDICATOR_INSET` removed. A room entry's own `indicators` keep their authored offsets. | `public/break_escape/js/systems/lighting.js` |
| Named confirm labels | main-21, d6, R4e | `confirm_action` takes optional `confirmLabel` and `cancelLabel`; a missing, empty or non-string label falls back to gameConfirm's Confirm or Cancel. Both are in the scenario schema. The X stays as it is (q99 is open). | `public/break_escape/js/systems/apply-actions.js`, `scripts/scenario-schema.json` |
| Switch confirms named | main-21, main-18, main3-14 | Every switch confirm in the three access test scenarios now names its choices: "Switch off" or "Switch on" with "Leave it"; the printer jams "Jam it" or "Clear it"; the breaker "Flip it"; the keystroke injector "Plug it in". 31 confirms (work 18, networks 5, social 8). | `scenarios/test_access_{work,networks,social}/scenario.json.erb` |
| Wall socket | main-21, d6 | Ian's socket (test_access_work, `ian_socket`) and Greg's (test_access_social, `f12_socket`) use the existing `wall_socket1` fixture on the back wall, between the whiteboard and the bookshelf, about 40 px from the PC, instead of a `ups_cabinet1` stand-in in the middle of the room. Texts per d6: "Switch off the wall socket under Ian's desk? His PC loses power." and "Switch the wall socket back on?". | same |
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

## Handover

Done. Commits: 294ec3b9b (dot, labels, drop, tests), 4fba8919c (sockets and wedge), e6ffd6cfa (wedge nudge), and this log.
