# lab_tesseract_trials confirmation run (dressing round 2 map changes)
Game 1627 (fresh), keyless :3001, headless. Logs: scratch `playtest2/session.jsonl` (foyer, common room) and `session2.jsonl` (after reload). World x,y are sprite top-left from the Phaser display list unless noted.

Server-side unlock (disclosed): after the foyer and common room were played on the untouched game, I unlocked `corridor`, `library`, `special_collections`, `workshop` with `game.unlock_room!` (rails runner), stopped the session and reopened game 1627 with `?skip_resume=1` + `bootstrap resume`. Special Collections was locked, so it was unlocked too; nothing past the unlocks was earned (the safe, locker 4, lockbox pads were opened only as far as the pad).

## 1 Foyer: PASS
- `freshers_stall2` at (222,206) 62x47, feet 253, depth 253.5, body. `freshers_stall1` absent (0 hits in the display list). Screenshot `confirm_foyer.png` shows the front-on purple stall right of the desks, nothing overlapping.
- Taps: CryptoSecure Lockbox `direct` -> PasswordMinigame (locked pad; harness `mismatch` is the generic-title false positive); Sign-up Laptop `direct` -> ExamineMinigame; ASCII Chart Handout `direct` -> NotesMinigame; Punched Paper Tape `approached-then-interacted` -> NotesMinigame. No pick-one menu on any of the four. The harness's moveToNear stopped short on the laptop and lockbox (still-out-of-range / no-effect-confirmed); a short `walk down` then `interact` opened them.

## 2 Common room: PASS
- `foosball_table2` top-left (360,139) 48x57, body, feet 196, depth 196.5 (room x 40-88). `foosball_table1` absent.
- Megan Oyelaran NPC position (419.2,151.4), sprite box (379,111)-(459,191), so centre (419,151), feet about 191 (room x 99, tile 3.1 along x; the expected y ~146 was 5 px off, she is at 151.4). The Snack Machine is x 434-476, y 70-130 (no body) and the sofa x 364-424, y 201-252 (no body): her feet (191) are 10 px above the sofa top and 60 px below the vending machine. Her body (about x 409-429) sits 1 px right of the foosball edge (x 408, y 139-196). The screenshot `confirm_common_room.png` shows her standing right of the foosball with clear floor on all sides; no overlap with foosball, vending machine or sofa.
- Taps: Megan `approached-then-interacted` -> PersonChatMinigame; Snack Machine `direct` -> ExamineMinigame; Candidate Locker 4 `approached-then-interacted` -> PinMinigame (locked, expected; from the north side the harness stopped short once, `still-out-of-range`, then moveTo (538,160) clicked through); Dr Schreuders (`cliffe_schreuders`) `approached-then-interacted` -> PersonChatMinigame; Dr Schreuders' Laptop `direct` -> ExamineMinigame after a `walk down 150` (moveToNear alone: `no-effect-confirmed`). No `via-interaction-menu` anywhere.
- Megan's chat: `converse` 4 turns ("Alright?" ... "Why do you want it so much?" -> "My mam's care-home fees..."), closed cleanly.

## 3 Special Collections: PASS
- `display_case3` top-left (-286,-179) 56x45 (room x 34, feet -134 = room y 250), body, depth -133.5. `plan_chest2` (-114,-314) 52x46 (room x 206, feet -268 = room y 116), body, depth -267.5. `display_case2` and `plan_chest1` absent.
- Special Collections Safe (`safe1`, -96,-175): `direct` -> PasswordMinigame pad (locked, expected).
- Walks: entering from the library north door took 1 `enter` call, arrived (-67,-155). moveTo along the east lane (x -48..-65) from y -150 to y -300 and back, and to the safe's front (-100,-177), reached each target with no snag (player ended at (-48,-325) at the north end, (-55,-183) at the south end; player centre sits about 25-38 px above the click point, consistent every time). One moveTo target (-65,-150) was on the safe's edge and just opened its pad, not a snag. Screenshot `confirm_special_collections.png` (player-follow view, the camera is re-centred on the player): case at the bottom-left, chest at the top right, safe at the bottom right, lane clear.

## 4 Workshop: PASS
- `printer_3d2` top-left (32,-191) 38x57 (room x 32, feet -134 = room y 250), body, depth -133.5. `printer_3d1` absent.
- `component_drawers1` x 32-69 (y -285..-244), `cnc_mill1` x 32-73 (y -238..-194): both start at x 32, inside the floor.
- Cliffe (`cliffe_workshop`) NPC (89.6,-191), box (50,-231)-(130,-151), body about x 80-100: 7 px clear of the CNC edge, 10-20 px clear of the printer and drawers, and the IT workbench starts at x 124. Tap `approached-then-interacted` -> PersonChatMinigame opened. `confirm_workshop.png` shows him standing between the machine column and the yellow-hatched workbench.
- Build screen `cliffe_build_screen` texture `smartscreen2` at (130,-368) 48x34, depth -319.45: still `smartscreen2` (not tapped this run).

## 5 Side doors: `enter` calls
| Crossing | Calls |
|---|---|
| foyer -> common room | 1 (crossed first call, arrivedAt 336,49) |
| foyer -> corridor | 1 |
| corridor -> library | 3 (two did-not-cross at 12,-82 and 48,-79, third crossed) |
| library -> special collections (north) | 1 |
| corridor -> workshop | 1 |
| back-crossings (special -> library, library -> corridor) | `no-known-doorway` every time even after `room` (4 tries each); by hand `moveTo` + one `walk` crossed first time both |
Library -> corridor by hand needed moveTo (-30,-60), which landed at y -80 (the door lane), then `walk right 600`.

## 6 Console, network, textures: PASS
- window.__logs hook (installed after load): 1322 lines before the reload, 1709 after. 0 `console.error`, 0 page errors, 0 "No Tiled item found" or random-position lines. Warnings: `[TTS] API error: 503` (expected), "Cannot update door pathfinding - room X not initialized", "No path to target" (harness), "Tables object layer not found or empty" (benign).
- Resource entries with status >= 400 after the reload: none seen (the TTS 503 is a fetch the page logged, not a resource entry).
- Display list across all loaded rooms: 111 textured sprites, 0 `__MISSING`/`__DEFAULT`. Stale textures `freshers_stall1`, `foosball_table1`, `display_case2`, `plan_chest1`, `printer_3d1`: 0 each. Duplicates (same texture and position): `door_sheet` stacked 4x at (-64,-128), (256,-128), (32,0) (shared door frames, existing behaviour) and `female_spy_v2` x2 at (15960,15929), an off-map parked sprite, not on any floor.

## Summary
| Item | Result |
|---|---|
| 1 Foyer stall2, four direct taps | PASS |
| 2 Common room foosball2, Megan placement and clearances, five taps, chat | PASS (Megan sprite centre (419,151), 5 px lower than the (419,146) forecast) |
| 3 Special Collections case3, chest2, safe direct, east lane | PASS |
| 4 Workshop printer_3d2, drawers/CNC x 32, Cliffe clear, smartscreen2 | PASS |
| 5 Side doors | foyer->common 1 call; corridor->library 3; others 1; back-crossings need hand walking |
| 6 Console, 4xx/5xx, missing textures, duplicates | PASS |

verify-run for game 1627: progress recorded, 5 rooms beyond the first, 0 objects unlocked (the unlocks were server-side).

## Files
- CONFIRM.md, confirm_foyer.png, confirm_common_room.png, confirm_special_collections.png, confirm_workshop.png (this folder).
