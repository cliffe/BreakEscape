# m10 live B1B: L5, distances, hearing, screenshots

Server: keyless (boot warning seen), :3099, puma PID 2372887, stopped at the end. Headless, setFPS(20), fixed steps on, fresh game per check (items 4, 5 and 7 each in their own game). `node_modules` is the untracked symlink already in the worktree, left alone. Scripts (scratchpad, not committed): item4.mjs, item5b.mjs, item7.mjs.

## Open point: home coordinates

`window.rooms.forward_post.position` is (0,0), so engine `home` (276,268) and (308,268) are world and room-local at once. Nothing to convert.

## Item 4. L5, ten needs-minutes unforced (game 7781)

| Measure | Darren | Sofia |
|---|---|---|
| Max distance of body centre from home over 601 samples (1 per second) | 0.5 px | 0.5 px |
| Left the two kettle cells | no | no |
| Caffeine at start / end | 19.9 / 59.7 | 20.0 / 62.0 |
| Jobs seen | opening brew only (using until about 26 s after sampling began) | same |

Clock delta 601.25 s needs-clock against 601.41 s wall: 1 needs-minute is 60.0 s real (ratio 1.000; the earlier "clock runs ahead" reading was wrong). The opening brew fires from closing the Netherton chat (L3 path); no second trip happened in ten minutes, so the pair did not walk anywhere at all. Doubt: this shows idle behaviour at the post, not a second trip, because caffeine fell only about 3/min and never reached a threshold.

## Item 5. Distances (body centres, px; homes D (276,268), S (308,268))

Reach checked three ways: engine `isObjectInInteractionRange` on the real player after walking there (arrival within 6 px), plus `moveToNear` for the singles. Reach is 32 px from sprite centre (body centre minus 31 in y).

| Target | Reach cell (body centre) | to Darren | to Sofia |
|---|---|---|---|
| Table items (sheet, plans), nearest found | (269,244) plans; (301,247) sheet+plans; (290,244) sheet+plans | 24.8; 32.7; 27.8 | 45.7; 22.0; 30.0 |
| Table case (`kit_table`), nearest | (318.5,254) | 44.7 | 17.5 |
| Netherton talk cells, nearest of four verified | (217,174) | 111.4 | 131.2 |
| Netherton, other verified | (203,180), (189,186), (217,150) | 114.6, 118.9, 132.1 | 137.2, 143.9, 149.2 |
| Netherton, all 50 engine cells (prefilter) | 120 to 178 px from the kettle midpoint | n/a | n/a |
| Incident file (6,8) tile centre | stands at (206,266); not in reach there | 70.1 | 102.1 |
| Incident file (5,8) tile centre | (176.6,271.9), in reach | 99.5 | 131.5 |
| Gate console (`moveToNear`) | (448,109); first run (442,84) | 234.5 (248.0) | 212.1 (227.8) |
| Gate terminal (`moveToNear`) | (511,86); first run (502,84) | 297.2 (291.6) | 272.6 (267.6) |
| Blast door, `door:forward_post->blast_tunnel` (`moveToNear`, door leaf at (610,128)) | (599,120) | 355.2 | 326.3 |

The plan's premise is wrong. PLAN 2.1 puts the nearest table reach cell on the north side at about 87 px. The folding table is only 78 px north of the kettle, and its south side is open: the player reaches the sheet and the plans from cells 22 to 28 px from the extras (the pair stand at the table's foot in the wide screenshot). The Netherton figure (111 px) is near the plan's 92.

### chaseRange

Left at 64, NOT changed. The rule "below the smaller of the table and Netherton distances" gives a value under 17.5 to 22 px, which covers only the two use cells and nothing around the kettle (the cells are 5.7 px from the posts; a player who is in melee reach of an extra is already 20 to 40 px away). No round value meets both "below the table" and "covers the kettle surroundings". Options for the orchestrator: (a) keep 64 and accept a struck extra chases to the table (the table is lore and kit sign-outs only, and the leash already stops at the room edge); (b) 16 so a struck extra never leaves the cells; (c) 100 to reach Netherton-safe (111) and drop the table criterion. No scenario edit made, so item 8 had nothing to confirm.

## Item 6. overhearRadius 320

320 covers Sofia's distance to the console (212 to 228 px) and the terminal (268 to 273 px); Darren is 235 to 298 px. No change. The blast door stand cell (`moveToNear`, 26.7 px from the door) is 326.3 px from Sofia and 355.2 from Darren, so it falls 6 px outside 320 and `ex_fp_radios` would not open there. The door accepts from up to 64 px, so a player stopping at the edge of the door's range stands about 62 px nearer (roughly 265 to 285 px from Sofia) and would hear it. Raising to 330 would cover the close stand cell for Sofia only; not done, since the plan accepts missing the exchange at the door (PLAN 2.5).

## Item 7. Screenshots (game with both using, clock 96 s)

- `screenshots/b1b-kettle-crop.png` (208x164): kettle and crate with both extras.
- `screenshots/b1b-yard-wide.png` (1200x800): the yard from the camera, work lamp at upper right.

Reading: the kettle sits on top of the crate and reads clearly against its green lid (depth 292.51 over the crate's 292.5, no clipping into the crate). Darren (drinking) and Sofia stand directly above it, Sofia at his right, readable at both sizes. Light on them is dim but legible; the pair and kettle are not lost. The work lamp lights the table and the middle of the yard more than the kettle corner, which is slightly darker than the rest. No lighting change made, none judged necessary.

## Edits

`tools/playtest/m10-ol-lib.mjs` settle() export and start-handle method kept (read and sound: plays the opening chat through).
Validator: 0 errors, 67 warnings. Lock/key diff: empty. `dungeon_graph.*` unstaged.

## Handover

Nothing outstanding in this slice. The chaseRange value (item 5) needs the orchestrator's call; BUILD_REVIEW_R1.md is untracked and not mine.
