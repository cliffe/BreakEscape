# m05 office life, build review round 4

Scope: Bernadette Lyons' post and her two espresso legs (to the machine and home), checked live in the break room. Positions are body centres in the break room's own frame (room position (-320,-128) subtracted), where tile (x,y) is the point (32x,32y). Lisa's body centre is (128,128). Pass mark: at least 48 px from Lisa on both legs.

## Findings

### M1. The walk home from the espresso left her at the mouth of the aisle (post (5,7))
- Severity: M.
- Evidence: a walk home stops within 32 px of its goal (`npc-behavior.js:1402` to `:1416`, no `arriveWithin` on the home walk). With the post at (5,7) = (160,224) she rested near (156,193), the south mouth of the aisle between the tables (local x 136 to 160). The return then ran 31 to 41 px from Lisa in nine of ten tries (earlier round, games 7414 and 7416).
- Failure scenario: after each coffee she walks down the side of Lisa's seat and into the aisle, brushing past a seated colleague, and leaves no standing room beside Lisa for the player to talk to her.
- Fix applied: post moved off the aisle line (see M2 for why (6,7) was not the answer).

### M2. Post (6,7) fixed the return leg and broke the out leg
- Severity: M.
- Evidence: live on game 7426 with post (6,7) = (192,224): return leg 54 to 62 px from Lisa (fixed), out leg 20 px in all five tries. From the east rest point (about (210,203)) the plain plan runs 212,180, 204,172, 196,164, 188,156, straight through the seated Niamh (body local 190,162 to 202,168). She bumps her, the bump handler inserts an avoidance waypoint, and the walk goes west along y 173 to x about 77, round table 1 and past Lisa. The route probe (`tools/playtest/m05-ol-r4-route.mjs`) now predicts this and fails (6,7), (7,6), (7,7), (224,208), (216,216) and (224,176) on a plan hit against Niamh.
- Failure scenario: every coffee trip from the evening reveal onwards sends the cleaner round the whole room and within 20 px of Lisa, in plain view of the player.
- Fix applied: post (7,4) = (224,128), open floor between table 2's chairs and the vending machine, clear of Thandiwe's chair, the bins and the machine. `position` and `needsHome` changed (scenario.json.erb), comment updated, PLAN.md rewritten for the new post. Probe plan from (7,4): out 56 px, back 56 px, bins out 68, bins back 100, no hits against any NPC body, closest approach to Niamh's body 9 px (from the stop point after the bins walk).
- Live proof, game 7439, five tries (see BUILD_REPORT.md, "R4 fixes"): out leg 58, 57, 57, 57, 57 px; return leg 58, 57, 57, 57, 57 px; no aisle samples; no detour in any path.

### m1. The plan's frame was wrong
- Severity: m.
- Evidence: the plan placed Lisa at (144,144) (tile centres) and used "x >= 159" as a limit. The engine puts a body centre at the tile corner, so Lisa is at (128,128) and local x is measured from the room origin.
- Failure scenario: a checker written to the plan's numbers measures against the wrong point and passes or fails by a tile.
- Fix applied: check L1a in PLAN.md restated in the local frame with Lisa at (128,128), both legs, and the aisle as x 136 to 160, y 176 to 208. The L1a probe tests `all >= 48` on the out leg and `>= 48` on the return.

### m2. The planning probe ignored other NPC bodies
- Severity: m.
- Evidence: the first probe version scored the (6,7) out leg at 52 px because it did not test planned legs against other NPCs' bodies; the live walk hit Niamh.
- Failure scenario: a candidate post that passes the probe fails live.
- Fix applied: the probe checks every planned leg against other NPC bodies with her 20 by 10 feet box (`hits`), reports `gap` to seated NPCs, and fails a leg that hits.

### n1. Seated Niamh is not in the world grid
- Severity: n.
- Evidence: the grid is built at room load while Niamh is still walking (0 of 6 cells under her seated rect), and `window.chairs` is empty in this room, so the per-search seat avoidance in `findWorldPath` adds nothing.
- Failure scenario: any plan that crosses a seated NPC's body ends in a bump.
- Fix applied: none in the engine. The scenario avoids it by choice of post, and the probe now models it.

### n2. The walk home rests 28 to 32 px short of the post
- Severity: n.
- Evidence: live rest points after the espresso are (193,114) to (193,121), which is 32 px from the post (224,128); the live tries therefore measure the short hops between that rest point and the machine, and the first walk from the post itself is covered by the probe plan (56 px), not by a live try.
- Failure scenario: a post placed on the assumption that she stands exactly on it is wrong by up to a tile.
- Fix applied: none. A tight `arriveWithin` for home walks is an engine backlog item.

### n3. The bump-avoidance waypoint counts the room origin twice (engine bug, not fixed)
- Severity: n (engine).
- Evidence: `npc-sprites.js:1541` to `:1584` builds the waypoint from world tile coordinates (-5,-1) and adds the room origin again, giving local (-160,-32). That is what sent her west to x about 50 in the failing runs.
- Failure scenario: any bump in a room whose origin is not (0,0) sends the NPC far off route.
- Fix applied: none, per the brief (scenario data only). Logged for the engine backlog.

## Bumps during the live walk

Game 7439, five tries: no detour in any sampled path; every out and return path is a straight run between (182,110) and (193,121), and the fifth try's bins trip ran (193,121), (214,142), (228,179), (247,213) to the bins at (252,212). No bump counter was recorded, so the absence of a bump is read from the path shapes. Niamh stood at (212,112) at the start of the run (not yet seated), about 30 px from the nearest path point.

## Checks

- Validator: 0 errors, 29 warnings.
- Lock/key diff: empty.
- `bin/test-js`: 752 passed, 0 failed.

Verdict: Findings M1 and M2 are fixed and proved live at 57 px or more on both legs in five of five tries. Nothing open in scenario data. n2 and n3 go to the engine backlog.
