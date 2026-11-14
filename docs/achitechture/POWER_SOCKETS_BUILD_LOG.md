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
