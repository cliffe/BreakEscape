Counts: 0 blockers, 0 majors, 1 minor, 3 nits.

# Tap pick fix: code review round 4

Branch `build/tap-pick` at 3b4c5acf1, reviewed as `git diff 8a13e720e..3b4c5acf1` (the R3 fixes,
commits 02a1721fe and 25a38140f), with the surrounding movement code read where the new option
reaches it. Line numbers are at 3b4c5acf1.

## Summary

The R3 fixes hold. The NPC-aware walk does what the build log says: in m06, the far tap on the
Trading Workstation from (160, 230) with the trader in the aisle walked round both NPCs and opened
the workstation in 3 of 3 runs, and far taps in m01 and floor taps are unchanged. The option is
opt-in exactly where the brief wants it: `walkToObjectThenUse` (core/game.js:2950) is the only
caller that passes `{ avoidNpcs: true }`; the floor tap, door, far-NPC, swivel-prop and test-bridge
walks all call `movePlayerToPoint(x, y)` and reset `playerLosOpts` to null on entry
(core/player.js:739). The `opaqueAt` rotation and flipY maths match Phaser 3.60's sprite transform.

The one minor is older than this branch: a tap into the next room with an NPC in the doorway
makes the player walk into the wall beside the door and stop, with no message. A floor tap does
the same, so it does not gate the merge.

No player_state or sync change: `playerLosOpts` is one module variable in client memory and is
never sent. No UI graphics changed; the new text goes through the existing `gameAlert` toast, so
the pixel-art rule is not engaged.

## The NPC-aware walk, checked point by point

- **Direct line** (player.js:768): refused through a standing NPC, so EasyStar decides. EasyStar
  already avoids non-immovable NPC bodies for every player walk (`findWorldPath(..., true)`,
  `_avoidNPCPositions`), so the two now agree for standing NPCs.
- **Smoothing** (player.js:792, npc-pathfinding.js:935): shortcuts through an NPC are refused.
  The raw route keeps two cells of side clearance from a standing NPC, so the `via` exemption
  (a route point within 4 px of the rect) does not let a shortcut back through.
- **Last-leg shortcut** (player.js:1274): rechecked every frame with the NPCs where they are now,
  so a detour round someone who has since moved away is cut as soon as the line is clear.
- **Waypoint corner check** (player.js:1310): only holds the player at a corner while still
  closing in and outside 3 px (`closing`, `WAYPOINT_TIGHT`), so an NPC standing across the next
  leg cannot pin the player there. No oscillation seen live.
- **No trap from the start or end point.** `crossesAvoidRect` skips a rect within 6 px of either
  end (path-avoid.js:149), so a player standing against an NPC, or a stand point beside one, is
  not refused.
- **Pathfinder calls.** One `findWorldPath` per tap (four when there is no route: the NPC-avoiding
  search, the reachable-cell search and its retry; the counter also caught NPC behaviour
  searches). None per frame: a failed line test never triggers a new search.
- **Cost per frame.** On a path, two `hasPlayerLineOfSight` calls a frame (last leg and corner);
  smoothing runs once per tap. Measured in the page: `getNpcBodyRects` 0.00005 ms, a line test
  with the option 0.0018 ms against 0.0012 ms without, three NPC rects in m06's two loaded rooms.
  A full walk made 40 to 70 line tests and stopped making them on arrival.
- **Moving NPCs** are read at their current body position on every call, so a patrolling NPC is
  handled frame by frame. **NPCs in other rooms** are included (every loaded room's
  `npcSprites`), which is right for a walk through a doorway; off-map cutscene NPCs at
  (16000, 16000) are included too and never cross a line.

## Minors

### m1. A tap into the next room with an NPC in the doorway walks into the wall and stops silently (older than this branch)

`public/break_escape/js/core/player.js:818-850` (the no-path branch of `movePlayerToPoint`), with
`public/break_escape/js/systems/npc-pathfinding.js:708` (`findNearestReachableWorldCell`).

When an NPC stands in a doorway, the NPC-avoiding EasyStar search finds no route. The fallback
asks `findNearestReachableWorldCell`, which floods the grid without the NPC avoid points, so it
returns a cell on the far side of the NPC. The second search to that cell fails for the same
reason, and the "should not happen" branch sends the player in a straight line at that cell,
which runs into the wall beside the door. For a far tap the object is in another room, so the use
is not armed and nothing is said.

Failure scenario, live (game 1892, m06, east door to blockchain_lab open): the analyst held at
(306, 80) in the doorway, player at (250, 150), far tap on the Blockchain Analysis Workstation
(366, 113). Two runs: the player walked to (279, 149), against the wall south of the door, and
stopped; no toast; 4 pathfinder searches. A floor tap at (360, 140) from the same place ended at
(279, 147) the same way. With the analyst away from the door the same far tap walked through to
(364, 147). The R3 option does not change this: the direct line here is blocked by the wall
before NPCs are considered, so main takes the same branch.

Fix (a movement change, best done outside this branch): in the no-path branch, retry
`findWorldPath` once with `avoidNPCs = false` before the reachable-cell search, and follow that
route, so the player walks up to the person in the doorway (where the movable NPC is pushed or
steps aside, and a far tap's use gets "Someone's in the way."), never into a wall. Or make the
reachable-cell flood honour the same NPC avoid cells, so the cell it returns can be pathed to.
Test: a grid with a one-cell doorway and an NPC avoid set on it; assert the player's route ends
at the doorway, not a straight line into the wall.

## Nits

### n1. Seated and other immovable NPCs: the option adds a test that the route then ignores

`public/break_escape/js/systems/npc-pathfinding.js:426` (`_avoidNPCPositions` skips
`body.immovable`) against `npc-pathfinding.js:607-619` (`getNpcBodyRects` keeps them).

A seated NPC is immovable (seating.js sets it on sitting), and so are scenario NPCs with
`behavior.immovable` (m02, m09, sis01 and the two labs use it). EasyStar routes straight through
their cells, so a route past one has points inside its rect and the `via` exemption lets every
shortcut through anyway. The walk then collides with the NPC as before. Nothing breaks; the option
just has no effect for these NPCs, and the comment says "standing NPCs" while the rects include
seated ones. Fix: either have the player search avoid immovable NPC bodies too when the walk asked
for `avoidNpcs` (pass the option into `findWorldPath`), or skip immovable bodies in
`getNpcBodyRects` and say so in its comment. A generic `b.checkCollision?.none` skip there would
also cover NPCs with collisions turned off for other reasons, not only knocked-out ones.

### n2. "Someone's in the way." can name a person who is not in the way

`public/break_escape/js/core/game.js:2899` and `game.js:2912-2921` (`npcBesidePlayer`).

The short-stop toast picks "Someone's in the way." whenever any visible NPC is within a tile of
the feet, including one seated at the next desk or standing behind the player. In the m06 desk
rows a walk that stops short against a desk next to Irina would blame her. Fix: count an NPC only
when it lies roughly between the feet and the object, for example when the dot product of
(npc minus feet) and (object minus feet) is positive and the NPC centre is within about 16 px of
that segment.

### n3. An NPC that stops on the remaining route is pushed into, not walked round

`public/break_escape/js/core/player.js:1274-1312`.

The route is planned once per tap. When an NPC walks onto the rest of the route and stays, the
player keeps walking into them until the pending use's blocked timer fires. Live (game 1892,
trader held on the route at (143, 152) and at (160, 130) from 350 ms after the tap): the walk
stopped against the trader and the toast "Someone's in the way." showed at 2.5 s and 1.1 s. That
message is correct and the player is free to tap again, so this is acceptable. If it matters
later: when `avoidNpcs` is set and the feet make no progress for about 500 ms with an NPC rect
across the next leg, re-plan once from the current position.

## Rotation and flipY in `opaqueAt`

`public/break_escape/js/systems/tap-pick.js:45-62`. Phaser 3.60 draws a sprite as
world = position + R(rotation) x S(scale x flip) x (local minus origin), with the flip shift
`x += -realWidth + 2 x displayOriginX` applied before the negative scale. Inverting that gives
local = S^-1 x R(-rotation) x (world minus position) + origin, then texel = w - lx for flipX and
h - ly for flipY, which is what the code does: the offset is rotated by minus the rotation, then
divided by the absolute scale, then mirrored after the bounds test (the mirror maps [0, w) onto
(0, w], and the `min(.., w - 1)` clamp handles the edge). I checked the quarter-turn test by hand:
(100, 70) on a sprite at (100, 100) turned +90 degrees maps to local (10, 40), and local (10, 40)
maps forward to (100, 70). The trimmed-frame offset and the flip use `realWidth`/`realHeight`,
as Phaser does. Tiled rotation (rooms.js:349) is applied with `setRotation`, so the sprite's own
transform is what is drawn and what the code inverts. No finding.

## The new messages

- "Can't reach it from here." reads well and matches seating's "Can't reach that seat from here.".
  It fires once, only after the walk has ended out of reach, and not when the player is knocked
  out or frozen (the busy check drops the use first).
- "Someone's in the way." from both the blocked and the short-stop path: see n2.
- Neither message is a spoken NPC line, so the TTS rule does not apply.

## Tests

Run without the lock: tap-pick.test.mjs and tap-pick-handler.test.mjs, 72 pass, 0 fail; the 29
other test files that import or read npc-pathfinding.js or player.js, or use
`hasPlayerLineOfSight`, 415 pass, 0 fail. The new tests cover the option with and without a
knocked-out body and the wiring by source match. Not covered by a unit test: the `via` exemption
against an NPC rect (a route point inside the rect lets the line through), which is what n1
turns on.

## Live checks

Keyless headless server on :3225 from the worktree, `session-start.sh --headless`, `smoothStep`
off, `setFPS(20)` with fixed steps on. Taps are `window.__test.clickAt`; the player and NPCs were
placed with `body.reset`; "held" NPCs were re-placed every 50 ms. `gameAlert`, `findWorldPath`,
`getNpcBodyRects` and `hasPlayerLineOfSight` were wrapped with counters in the page.

| Check | Game | Result |
|---|---|---|
| Far workstation from (160, 230), trader at (160, 185) in the aisle | 1892 (m06) | 3 of 3: walked round both NPCs, ExamineMinigame "Trading Workstation" at 0.9 to 1.0 s, no toast, 1 search |
| Same from (60, 240), trader at (160, 224) | 1892 | Opened at 1.15 s, no toast |
| Trader walked across the route mid-walk at 120, 60 and 30 px/s | 1892 | 3 of 3 opened at 1.1 s, no toast |
| Trader parked on the remaining route at 350 ms | 1892 | Walk stopped against him; "Someone's in the way." at 2.5 s and 1.1 s (n3) |
| Analyst in the east doorway, far tap into blockchain_lab | 1892 | 2 runs: walked into the wall at (279, 149), stopped, no toast; floor tap the same (m1) |
| Same, analyst away from the door | 1892 | Walked through to (364, 147) |
| Analyst wandering across the lab during a far tap on the lab workstation | 1892 | 2 of 2 opened at 1.7 and 1.9 s; a third tap landed on the analyst's figure and walked to him, as designed |
| Far phone from (160, 240); far Building Directory from (250, 240) | 1893 (m01) | PhoneChatMinigame at 1.0 s; NotesMinigame at 1.1 s; no toast |
| Floor taps (60, 240) to (250, 200), (128, 200) to (128, 100), (250, 250) to (60, 110) | 1893 | Straight lines, 0 line tests with the option, 0 searches, unchanged |

Games created: 1892 (m06_follow_the_money, started in trading_floor), 1893 (m01_first_contact).
Sessions and server stopped.
