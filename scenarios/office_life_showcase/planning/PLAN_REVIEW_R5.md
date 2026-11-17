# office_life_showcase: plan review, round 5 (delta, final plan round)

Review of the round 4 fixes, `git diff 286265869..20ef4200e` on `PLAN.md` (only file changed), at 20ef4200e. Counts: 0 B, 0 M, 1 m, 2 n. Engine paths are under `public/break_escape/js/`.

## Findings

### m1. The pathable lane widths are overstated, and the primary spot's west lane is one cell or none (section 2, Ama's spot; S1 W1 and W2)

Evidence. The grid cell is 8 px (`utils/constants.js:37`). `markBlocked` blocks every cell a body touches, then adds one more cell each side (`cx1 = floor(left / 8) - 1`, `cx2 = floor((right - 1) / 8) + 1`, `systems/npc-pathfinding.js:354-369`), so the blocked span is the body rounded outward to the cell grid plus 8 px each side: 8 to 15 px of padding per side, not "16 px in all". Desks are static bodies and get the same treatment. Taking the grid to be aligned with the room (room origin a multiple of 8, not checked) and the plan's body numbers (Ama x 142 to 162, west desk edge 108, east desk edge 210):

| Spot | Lane | Plan says (pathable) | Blocked cells (x px) | Free cells | Pathable width |
|---|---|---|---|---|---|
| Primary (152, 144) | west | about 18 px | desk to 119, Ama from 128 | cell 15 only (120 to 127) | 8 px, 1 cell |
| Primary | east | about 32 px | Ama to 175, desk from 200 | cells 22 to 24 (176 to 199) | 24 px, 3 cells |
| Fallback (176, 144) | west | about 42 px | desk to 119, Ama from 152 | cells 15 to 18 (120 to 151) | 32 px, 4 cells |
| Fallback | east | closed | Ama to 199, desk from 200 | none | closed (plan is right) |

Outward rounding means the true result depends on where the room sits on the 8 px grid: the primary west lane is anywhere from 0 to 2 cells, the east lane 2 to 4, the fallback west lane 3 to 5. The plan's figures (18, 32, 42) are the best case with no rounding loss.

Can a walker pass a one-cell lane? Yes, physically. The pathfinder moves cell centre to cell centre with corner cutting off (`:300-330`, `disableCornerCutting`), so a vertical walk down cell 15 keeps the walker at x 124. The NPC feet box is 20 px wide for an atlas sprite (`systems/npc-sprites.js:110`), so it spans x 114 to 134: 6 px clear of the desk (108) and 8 px clear of Ama (142). It fits, single file, and only if the alignment gives one cell. Two walkers meeting nose to nose in that lane cannot sidestep (`handleNPCCollision` needs room), so they stall or settle and re-plan.

Which walks need which lane? Checked against the plan's routes:
- Everyone to the west door: the line along y 80 to 96 runs above the desks, far from Ama's blocked rows (y 136 to 152 once the 2 px vertical pad is applied). Needs no lane.
- Chidi to the coffee: east of the east desks. Needs no aisle lane. If that east strip turns out to be closed, the east aisle lane (3 cells at the primary spot) is the alternative.
- Jun to the coffee: from the south-west desk, below Ama's rows. Needs no lane.
- Jun back from the west door to his desk: the only walk that needs the aisle (W2). At the primary spot it uses the west lane if that has a cell, else the east lane (three cells, about 100 px of detour), else it has no route and EasyStar returns null.

So the routing the plan relies on survives at the primary spot, but only through W2's east lane fallback, and the plan's own wording ("W2 confirms Jun gets through the west lane at the primary spot") is the weak point. The plan also runs W1 and W2 at the fallback spot only ("both with the same fallback spot", S1), so the primary spot's lanes are never checked by a named test.

Failure scenario: the room sits on an 8 px offset that leaves 0 west cells at the primary spot; Jun comes back through the east lane, which Chidi's return and a coffee queue also use; two walkers meet in a 24 px lane and stall for the settle interval, so the "Jun is back at 4:45" beat slips, or the timed run in S3 misses B8.

Fix. Recommend building at the fallback spot (5.5, 4.5) = px (176, 144) from the start, not as a fallback:
- Its west lane is 4 cells (3 to 5 under any alignment), so it never closes and two walkers can pass with a cell to spare; the primary west lane can close.
- It sits 24 px from Graham's chair body instead of 6, and the plan already says it stays off the door line.
- The cost is the east lane (closed for pathing, still 24 px of physical gap for the viewer's body, which the viewer's click path will not use because the same grid is closed there). Nothing in the plan routes through that lane: Chidi goes east of the east desks, the coffee runs go below, the door walk is above.
- The viewer's start (152, 192) is below and 24 px west of the fallback; no engine rule depends on that offset.
If the author keeps the primary spot, then: (a) restate the table above in section 2 (8 and 24 px nominal, 0 to 2 and 2 to 4 cells by alignment); (b) add to S1 a check before any walk, reading `window.__test`'s or the pathfinder's `worldGrid` row at y 144 and counting free cells between the desks, with the rule "fewer than 2 free cells west: move to (176, 144)"; (c) run W1 and W2 at the primary spot first, then again at the fallback only if one fails.

### n1. Unbalanced bracket in S1's W1 text (section 11, S1)

The sentence reads "W1, the NPC grid treats Ama as an obstacle ... no NPC stalls or takes a long detour); W2, ...", with a closing bracket and no opening one. Fix: open a bracket after "W1" or drop the closing one.

### n2. Section 2 still says the pathfinder pads by "one 8 px cell each side" (section 2, Ama's spot)

Correct as far as it goes (`systems/npc-pathfinding.js:354-369`), but it omits the outward rounding to the cell grid that costs up to 7 px more per side, which is why the lane figures are optimistic (m1). Fix: say "pads by one cell each side after rounding the body out to the 8 px grid".

## Round 4 findings

- m1 (Ama movable): resolved. Ama's row now carries `"behavior": { "facePlayer": true, "immovable": true }` with the reason. Checked: `immovable` sets only the body flag (`systems/npc-sprites.js:138-141`); `facePlayer` is read from the behaviour config and defaults to true (`systems/npc-behavior.js:627`, used at `:1101`, `:1155`, `:1239`), so she still turns to the player and talks. An immovable body enters the NPC grid through the immovable-body loop (`systems/npc-pathfinding.js:374-380`, `markBlocked`), so walkers route round her and the player's search drops her from the berth list (`_npcBerthBoxes` skips immovable bodies, `:429-445`). A walker touching an immovable NPC does not settle (`systems/npc-sprites.js:1388-1393`), so contact cannot freeze a walk. W1 is reworded correctly. The lane numbers it relies on are the issue in m1 above.
- n1 (S2 does not log `chidi_pc_screen_locked`): resolved. S2's proof now logs it on Chidi's first coffee leave and expects the chime on every coffee run.
- n2 (W1 and W2 in S1 only; 56 px): resolved. T2 names W1 and W2 (section 11), and S1 says 58 px with body x 166 to 186 and desk edge 108, which is right (186 would be the body edge; 166 minus 108 is 58).
- n3 (chime on every coffee run): resolved. Row 2.2 states it and S2 expects it.

## Checked and confirmed

- No new spoken lines or sync keys in the diff.
- The 58 px figure is the physical west lane at the fallback spot; its pathable width is 32 px (4 cells), not 42 (m1).
- Chidi's PC lock on the first coffee leave: unchanged from R4, the 12 s dwell exceeds the 10 s threshold.

## Verdict

plan ready to build: yes

The one minor does not stop the build: S1 contains a walk check that would catch a closed lane, and the fallback spot exists. Switching the build default to (176, 144) removes the dependence on grid alignment.
