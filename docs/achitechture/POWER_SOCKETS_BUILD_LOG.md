# Power sockets build log

Branch `build/power-sockets` (from main 896ec3cd8), 2026-11-14.

Scope (user picks): swap the five existing switch sockets to the approved plug-and-cable art (P8c A, `ui-art/p8c_plug_cable_32x48.png`), each with an on and an off sprite. Hand-placed, no engine placement code, no code-drawn cable (the d8 `poweredBy` idea is dropped), no new generation.

## Art

Four 32x48 hand edits of the approved PNG, made with PIL (no resampling; the left copies are horizontal flips):

| File | State | Edit |
|---|---|---|
| `power_socket1.png` | on, cable curls right | switch pixels (12,3) and (13,3), the dull orange (158,117,41), become red (235,28,28) |
| `power_socket_off1.png` | off, curls right | the same two pixels become plate colour (218,214,205) |
| `power_socket2.png` / `power_socket_off2.png` | on / off, curls left | horizontal flips of the two above |

In all four, the tan pixel at (9,3) (221,185,150) becomes plate colour, so the red mark is the only colour on the plate. Brightness is as approved. The four files match the coordinator's reference mocks (`p8c-plan/mock2/on_r, off_r, on_l, off_l`) pixel for pixel.

Registered with `python3 scripts/room_gen/register_object.py --wall power_socket1 power_socket2 power_socket_off1 power_socket_off2`: `catalog.json`, `tilesets_ref.json`, `objects_hospital_extras.tsx` (tiles 674-677, gids 1475-1478), the `game.js` preload and `WALL_MOUNTED_EXTRAS` (`power_socket`, `power_socket_off`). If another branch registers extras before this merges, the tile ids will clash and need re-running.

## State swap

No engine change. Each socket object now has `"type": "power_socket1"` or `"power_socket2"` and one `spriteVariants` entry on its existing off global (for example `{ "condition": "globalVars.ian_pc_unplugged", "value": "power_socket_off1" }`). The objects are positioned by x/y with no Tiled match, so they go through `createSpriteAtRandomPosition` (variant applied at load) and `registerSpriteVariantListeners` (live swap). Both fired in the live runs below. `triggerOnInteract` and the confirms are unchanged.

## Placement

| Socket | Scenario | Sprite | Top-left (tiles) | Notes |
|---|---|---|---|---|
| `ian_socket` | test_access_work, cable_room (room_office) | curl right | 3.375, 0.75 | Plate in the gap between the chalkboard and the bookcase; cable curls towards Ian's PC and under the bookcase foot. |
| `f12_socket` | test_access_social, f12_room (room_office) | curl right | 3.375, 0.75 | Same map and layout as Ian's. |
| `office_copier_socket` | test_needs_sims, office | curl left | 5.65625, 0.75 | Plate between the bookcase and the chalkboard; curl ends just right of the copier's top. |
| `office_coffee_socket` | test_needs_sims, office, east wall | curl left | 8.65625, 7.0625 | Plate on the side-wall strip where the old one was; cable drops down the wall and curls to the coffee machine. |
| `kitchen_copier_socket` | test_needs_sims, kitchen, east wall | curl left | 8.65625, 6.625 | Plate on the wall strip; the cable goes behind the copier (socket depth 260.5, copier 280.5). |

**Reach limits plate height on back walls.** `isObjectInInteractionRange` (`interactions.js:2307`) measures `dy` from the sprite's top edge to the player's centre, with a 32 px range. A tap-walk towards a back-wall plate stops with the player centre at about y 52 to 55, so the sprite top must be at y 22 or lower down the wall. At top y 16 (curl on the skirting), the first live run said "Can't reach it from here." for a player standing under the socket. At top y 24 (0.75 tiles), the plate is at y 25-34 and every click opened the confirm, including one from directly under the socket with the player centre at y 55. The cost is that the curl lies about 6 px out on the floor in front of the skirting rather than on it, and the back-wall sockets get depth 72.5 instead of the shared wall depth 64.5. A cable lying on the floor at the wall foot reads naturally. Nothing is hidden, and the plate is clear of the frame, boards and bookcases in every shot.

**Kitchen copier.** At top-left y 7.1875 the validator warned that the socket and the copier are pinned 24 px apart (inside the 32 px interaction range). At 6.625 the warning is gone and the cable runs behind the copier.

## Tests

- Validator (`--skip-ink --no-graph`): test_access_work 0 errors 8 warnings, test_access_social 0 errors 6 warnings, test_needs_sims 0 errors 31 warnings. The warning counts match main.
- Node, each file run with plain `node`, one at a time: 37 files that read the changed files (scenarios, `game.js`, catalog, tilesets), plus the spriteVariants tests (`table-group-variant-listeners`, `lighting-workstation-indicators`, `screen-states`, `table-item-overlap-grouping`). All pass, 0 failures.
- Python (`scripts/room_gen`, unittest): `test_room_edit` 10 OK, `test_table_surfaces` 4 OK.
- Rails, one file at a time: format_8a/8b/8c corpus (21/29/23 runs), asset_loading_integration (16), static_files_controller (31), npc_workaround_h (36), capture_record (14). 0 failures, 0 errors.
- No engine or tooling code changed, so no new unit tests were needed. `register_object.py` only appended entries.

## Live proof

Keyless server from the worktree on :3410. Games 4964 (test_access_work, start cable_room), 4965 (test_access_social, start f12_room) and 4966 (test_needs_sims), made with `tools/playtest/new-game.rb`. Headless sessions with physics at `setFPS(20)` and fixed steps on, needs debug overlay off (`gameScenario.needsDebugOverlay = false`). Each switch was a real world click on the plate (`__test.clickAt`, through the scene pointerdown router), which walked the player up, followed by the real "Switch off" / "Switch on" button click.

| Socket | On to off | Off behaviour | Reload | Off to on |
|---|---|---|---|---|
| Ian | texture `power_socket_off1`, `ian_pc_unplugged` true | W6 task "Ian's PC is dead and he parks", Ian's no-entry icon | off texture and global kept after reload | `power_socket1`, global false |
| F12 | `power_socket_off1`, `f12_pc_unplugged` true | Greg parks (`npc_need_parked:greg`), frustration event | (not repeated) | `power_socket1`, global false; also checked from directly under the socket |
| Office coffee | `power_socket_off2`, `office_coffee_off` true | Amara and Tom park caffeine with reason `no_source` | off texture and global kept after reload, with the new art loaded | `power_socket2`, global false |
| Office copier | `power_socket_off2`, `office_copier_off` true | needs system `_isOff(office_copier)` true while off, false after | (not repeated) | `power_socket2`, global false |
| Kitchen copier | `power_socket_off2`, `kitchen_copier_off` true | `_isOff(kitchen_copier)` true while off, false after | (not repeated) | `power_socket2`, global false |

Contact sheet (scratch): `power_sockets_contact.png`, with the four sprites at 6x and 15 in-game 3x crops.

Path notes from the runs. These are about the players' route, not the sockets:
- From the right of the office copier socket, and in one Ian run, the walk ended with "Someone's in the way." because the seated NPC blocked the path. A click from the open side worked every time.
- A plate click with the player standing in the kitchen-office doorway did nothing and gave no toast. From the kitchen floor it worked.

## Round 2: drop sprite, reach to the whole socket, wall_socket1 retired (2026-11-15)

User decision: keep the art, but add a version whose cable drops straight to the floor line (as if under the carpet), because a visible cable end looks bad; the end should be covered by the device it powers. Move the curls back to the skirting, accept the in-reach blue tint, retire `wall_socket1`.

### Art

| File | Edit |
|---|---|
| `power_socket_drop1.png` | `power_socket1` rows 0-12 kept (plate, red mark, plug); rows 13-47 cleared and the cable's two columns (x 11-12, colours (47,46,46) and (66,66,66)) continued straight down to row 47, the last row. |
| `power_socket_drop_off1.png` | the same edit of `power_socket_off1` (no red). |

On and off differ only in the 2 red pixels, as in round 1; 7 and 6 colours, no resampling. The cable is centred on the plate (plate x 8-15, cable x 11-12), so no mirrored copy was made. The canvas stays 32x48 with the plate where `power_socket1` has it, so the plate's position follows from the same top-left. Registered with `register_object.py --wall`: tiles 678-679, gids 1479-1480 (no other branch or commit uses them: `git log --all -S` on the .tsx and catalog), `game.js` preload, `WALL_MOUNTED_EXTRAS` `power_socket_drop` and `power_socket_drop_off`.

### Curl or drop, per socket (rule: no visible cable end)

| Socket | Choice | Why | Position |
|---|---|---|---|
| `ian_socket` | drop | Ian's PC stands well away from the wall | 3.375, 0.5 (bottom on the floor line, y 64) |
| `f12_socket` | drop | Greg's PC likewise | 3.375, 0.5 |
| `office_copier_socket` | drop | the copier's top is at y 64, the floor line, so a curl on the skirting (ending at y 61-62) could never be under it | 5.90625, 0.5 (plate where it was: the drop's plate is 8 px further left in the canvas than `power_socket2`'s) |
| `office_coffee_socket` | curl (unchanged) | the curl's last 5 columns (x 0-4, rows 44-46) lie inside the coffee station's opaque table-and-cup rows, and the station (depth 297.5) draws over the socket (274.5) | 8.65625, 7.0625 (top y 226, not raised) |
| `kitchen_copier_socket` | curl (unchanged) | the curl's last 11 columns are inside the copier's opaque body, which draws over it (280.5 against 260.5) | 8.65625, 6.625 (32.4 px from the copier's position) |

Checked by pixel overlap of the sprites at their scenario positions and in the live shots. The three back-wall sockets have the sprite bottom at y 64, so their depth is the shared back-wall 64.5 with no `elevation` override (rooms.js auto elevation is 0 at the threshold); the player's minimum depth against the wall is 72.5, so it always draws in front (`ian_wallplayer` shot).

### Reach: `reachY`, opt-in

With the bottom on the floor line the plate (y 17-25) is out of the 32 px reach of a player whose tap-walk stops at centre y 45-55, because reach was measured to the sprite's top edge. `reachY(sprite, fromY)` in `systems/interaction-reach.js` is the vertical counterpart of `reachX`: it clamps the player's y into the sprite's vertical span, so standing level with any part counts as being at that part. It only ever shortens a reach.

Scope: only scenario objects with `"wallMounted": true` (new schema key and validator-known field). Every other sprite keeps `sprite.y`, so bookcases, vending machines, NPCs and doors reach exactly as before. An automatic rule (every tall sprite, or every `WALL_MOUNTED_EXTRAS` type) would have grown reach for objects nobody has checked, and the engine has no wall-mounted notion today; an opt-in key costs one line per socket. The three back-wall sockets carry it; the two side-wall sockets do not need it.

Where it is used: the highlight check and `isObjectInInteractionRange` (dy), `handleObjectInteraction`'s range check, the E key's candidate distance (the facing angle still aims at the top edge, through a new `faceY` argument, so E scoring is unchanged), the info label, and `objectStandPoint` (tap-pick.js, new optional `deps.reachY`, passed by `walkToObjectThenUse`) so the tap-walk picks stand points by the same measure the arrival check uses. The test bridge mirrors it wherever it mirrors `reachX`: `describeObject` (inRange), `solveStandingPointWhere` and its rivals, `plainNearestEntity`, and `moveToNear`'s nudges and landing check. Test stubs that fake `interaction-reach.js` now export `reachY`; `tap-pick-handler` lists it among game.js imports.

Tests: `test/js/interaction-reach-wall-mounted.test.mjs` (11): the clamp, the opt-out cases, "only shortens", the real `isObjectInInteractionRange` from below, the left, the right and against the wall (and out of reach from afar and for an unmarked sprite), `objectStandPoint` with `reachY` ending where the real check passes, and that the bridge and engine call sites use it.

### wall_socket1 retired

References: `game.js` preload (removed); the PNG (moved to `tmp/delete/`, removal staged); `tools/office_art_icons.py:96` (no longer writes it, one-line comment). Not in catalog.json, tilesets_ref.json or any .tsx, so no room tilemap can hold its gid. Left alone: the frozen `test/fixtures/format_8{a,b,c}` snapshots, the synthetic objects in `npc-coffee-off.test.mjs` and `npc-printer-power.test.mjs` (the type plays no part), and history docs (HANDOVER_OFFICE_S18A, OFFICE_LIFE_PLAN, UX_SLICE15 build log and reviews).

### Live proof

Keyless server on :3448 from the worktree, games 5134 (test_access_work, cable_room), 5135 (test_access_social, f12_room), 5136 (test_needs_sims); headless, `setFPS(20)` with fixed steps on. Every switch was a real click on the plate (`__test.clickAt`), a tap-walk, then the real confirm button.

| Socket | From | Player stopped at (centre) | Result |
|---|---|---|---|
| Ian | left (64,112 feet) | 96, 49 | off, `power_socket_drop_off1`, global true |
| Ian | right (197,107) | 128, 47 | on |
| Ian | below (118,167) | 108, 47 | off |
| Ian | reload (closed and reopened the session) | | still off, off texture, depth 64.5 |
| Ian | below (132,181) | 109, 47 | on |
| F12 | left, right, below, left | 96,49 / 129,46 / 108,47 / 89,48 | off, on, off, on |
| Office copier | left (122,136) | 166, 45 | off |
| Office copier | right (279,85, past the seated NPC) | 205, 45 | on |
| Office copier | below (200,158) twice | 188, 46 | off, on |
| Office coffee | west (197,223), north (271,164) | 258,220 / 274,212 | off, on (`power_socket_off2` / `power_socket2`) |
| Kitchen copier | kitchen floor (-118,235), (-80,153) | -66,212 / -54,192 | off, on |

Depths: back-wall sockets 64.5, coffee 274.5, kitchen 260.5. Contact sheet (scratch, `power-sockets-v2/contact_sheet.png`): the four sprites at 6x, out-of-reach on and off crops of all five, and the player pressed to the wall under Ian's socket.

### Checks

- Validator (`--skip-ink --no-graph`): 0 errors; 11, 10 and 33 warnings for test_access_work, test_access_social and test_needs_sims, the same counts and the same warnings as main 082c51fb7 run in the main checkout.
- Node, plain `node`, one file at a time: every test/js file that mentions interaction-reach, reachX/reachY, interactions.js, spriteVariants, the test bridge, tap-pick, info-label, the catalog, the extras tileset, the schema or the socket types (86 files, the new test among them): 1278 tests, 0 failures.
- Rails, one file at a time: format_8a/8b/8c corpus (21/29/23 runs), tts_office_lines (9), capture_record (14), npc_workaround_h (36); 0 failures, 0 errors.
