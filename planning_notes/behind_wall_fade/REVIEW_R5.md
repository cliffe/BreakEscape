# Behind-the-wall fade: review round 5

Reviewer: fresh read of DESIGN.md only (no earlier REVIEW files), checked against the working tree on 2026-11-08 and against phaser@3.60.0 source where the wording looked shaky.

Counts: **0 blocker, 1 major, 10 minor.**

## What I checked and found correct

So the next round needn't repeat these:

- **Decisions.** All nine match the user's settled list: what fades, ownership by listing, elevation only through the drawn rect, whole width, open-doorway suppression plus the gap column, the per-part light blend, glows/LEDs/flames/flashes at k with light-map stamps unscaled, a transparent frame edge counting, and 50% / 150 ms / 200 ms / instant.
- **No leftover door fading.** No door sprite is ever written. The `doorProperties` filter, the §12 unit test ("no sprite in any `doorSprites` list is ever written"), step 5 (both door sprites at 1, no `behindWallK`) and step 11 all agree. `debugState()` has no door fields.
- **File:line references.** These match the tree:
  - core/game.js: the `installSeating(this)` call at 1833, `update()` at 2469, the `time.delta` call at 2484 and the lighting block at 2503.
  - door-gaps.js: the provider at 8-17. Only game.js:10 imports door-gaps.js, and no test copies it.
  - interaction-walls.js: 40-41, 88-99 and 152-161.
  - rooms.js: layer creation at 1995-2089, `updatePlayerRoom` at 3122-3150, `loadRoom` at 921 and :3436, and the explicit-position override at 2441-2456.
  - doors.js: placement at 75-117; sprite, body and `doorProperties` at 440-584; open bookkeeping at 833-876 and 1001-1009.
  - npc-needs.js: `makeCosmetic` at 3327-3344 and `removeCosmetic` at 3776-3780.
  - seating.js: 836-842 and 1519-1522.
  - lighting.js: every site named in §8.1 and §8.2 (1019-1024, 1049-1055, 1060, 1086-1087, 1110, 1153, 1160, 1172, 1183, 1186-1199, 1208-1227, 1256, 1269, 1327, 1336-1356, 1364-1420, 1469-1490, 1495).
  - The test bridge: `waitUntil` at 1564-1570, `walk(direction, ms)` at 1166, `interact` at 910, `enterRoom` at 782, and door ids `door:<room>-><room>` at 106.
- **Every stamp in the room loop is a `.stamp` call.** The only other light-map calls are `setPosition`, `clear`, `beginDraw` and `endDraw` (grep `rt\.`), so the `drawTarget` switch covers them all.
- **Phaser 3.60.0 spot checks.** `GetFastValue` treats an `undefined` value as absent. `DynamicTexture.stamp` reads exactly the 12 keys in `STAMP_OPT_KEYS`. `setSize` updates only `this.get()`'s frame. `getWebGLTexture` exists at 1502, and `Frame.glTexture` is copied at Frame.js:79.
- **Test scenario geometry**, from the four maps' JSON:
  - Door columns are x 32-64 and 576-608.
  - Hall `room` (19,0) is 610, and hall `walls` (10,1) is 13 under `room` 611.
  - Reception's `room` (0,1) and (2,1) are non-null, and (1,1) is the doorway.
  - pc10 has top 36, safe3 x 85-109 with top 62, and the hose reel x 566-602 with top 17.
  - The door collision body is the 8 px at the bottom of the door sprite (doors.js:574-577), so a player stopped by the closed door has feet at about S.y + 56, inside the strip. Step 5 works.
- **Ambient values make steps 3 and 7 achievable.** Lit ambient 0xc4cad8 has luma about 0.79 and dark ambient 0x101424 about 0.07 (lighting.js:94-95), so "C below 0.2" and "A at least 3x unfaded" hold with room to spare.

## Major

### M1. Door spill on the north room's floor isn't in L_N, so the faded strip cuts the doorway's light pool off with a straight edge

**Evidence.**
- `stampDoorSpill` runs after the room loop with `drawTarget = rt` (DESIGN §8.1 step 2; lighting.js:1192). The tee therefore never records it, and §12 "Tee" says so explicitly: "door spill [is] not in the commands".
- For an N/S door between a brighter S and a darker N, spill puts a pool on N's floor centred `TILE_SIZE * 1.2` = 38 px north of the door centre, radius 70.4, alpha `0.55 * diff`. It adds a second stamp at `door.y + 8`, radius 45, inside the strip (lighting.js:1409-1418, with the flip at 1404-1408 when the opener is N's sprite).
- §8.1 accepts the result ("the one light that N's floor just north of the strip has and the blended strip lacks"). Its reason for having no fix is that a third ADD-only batch on the light map can't work.

**Failure scenario.** This is step 4's own set-up: office_n is dark, the hall is lit, and the office_n/hall door is open at x 48.
1. The pool sits at (48, −6) and covers about x −22..118 at y = 0.
2. At w = 1, the segments [0, 32) and [64, 320) show office_n's dark light, so the pool's lower half is removed below y = 0 for x 64..118 (and 0..32).
3. The player stands at x 160, about 40 px from that edge. Screenshot 4 will show a bright half-disc on office_n's floor, sliced flat along the top of the strip, with a lit 32 px column in the middle.

In play it appears in any dark-mode north room (or one in a brownout or with a faulty panel) above a brighter south room whose N/S door is open. It sits right where the player walks along the wall. It contradicts §8.1's own aim that "the strip follows N's floor frame by frame".

**Fix.** Replay the spill into the strip texture. The objection in §8.1 doesn't apply there, because inside the segments the strip batch is an opaque fill. ADD then composes with `[ONE, DST_ALPHA]` at destination alpha 1, exactly as in the main batch.
- In `update()`, when there are segments, set `drawTarget` to a spill tee (`teeFor('__spill')`) for the spill loop. Pass `drawTarget` instead of `rt` to `stampDoorSpill`, which also covers its direct `rt.stamp` for the closed-door leak at :1401.
- In the strip batch, replay the `'__spill'` commands once, after every north room's fill and commands and before the closing black ADD. Spill is drawn after every fill in the main map too.
- Update the §12 "Tee" test: spill is recorded once, in the spill list only, and replayed last in the strip batch. The main-map comparison stays the same.
- Step 4's x range can stay as it is, and an extra sample at (100, 40) should then match (100, −20) within 6/255.

Keep the doorway column out of the segments, as the user decided. With the spill shoulders now inside L_N, the column's edges also soften.

A smaller case of the same kind is left over, and accepting it is reasonable. When N and S are equally dim (dark/dark), N is drawn first (lighting.js:1078-1080), so S's back-wall emitter stamps bleed onto N's floor. The faded strip then cuts those glows at the strip's top edge too. Say so in §8.1's case list, so the implementer and the Opus reviewer don't report it as a bug.

## Minor

**m1. §11 risk 4 names the wrong variable.** It says "every stamp in the room loop goes through `target`". §8.1 step 2 says the variable must be `drawTarget`, because `target` already exists twice (:1060, :1256). An implementer copying the comment text could reintroduce the name clash. Fix: change it to `drawTarget`.

**m2. The commit order contradicts itself.**
- §12's opening line and §13 say to commit before running tests, with fixes in follow-up commits. That is the standing rule (memory "Commit before testing").
- §13 also says "Before each engine commit run `bin/test-js` in full; before the slice 2 and slice 4 commits also run `bin/rails test` and the reopen check".
- Fix: "Commit the slice's files, then run the full `bin/test-js` (plus Rails and reopen for slices 2 and 4); fix in follow-up commits. A slice is done when they pass."

**m3. `git commit -m "..." -- <path>` can't commit a new file.** Slice 1 creates two new files, and slices 2 and 4 create more. `git commit -- <untracked path>` fails with "pathspec did not match". Fix: `git add <explicit new paths>`, check `git diff --cached --stat`, then commit with explicit paths.

**m4. Step 7's walk is stopped by a hall prop, not the wall.**
- room_pnw_genhall has an object at x 470-521, y 245-300, with a collision box at x 472-519, y 276-288.
- Walking down at x 480 stops the feet at about y 276. That is still inside the server's strip (above 260), so detection holds, but it isn't "the bottom wall". Steps 7 and 12 then take their screenshots and samples with the player partly in front of the prop.
- §12 says x_s must be farther than `def.radius + 8` from every server emitter's centre. The server's UPS and racks span world x 413-610, so in 330-550 that leaves only about 330-350. Unlike steps 4 and 10, step 7 gives no fallback.
- Fix: start step 7 at `moveTo(440, 200)`. x 413-469 is clear of the hall's bottom props, and the feet reach the wall at about 312. Restate x_s as "at least 60 px from 440", and add step 4's fallback ("if none qualifies, use the x farthest from every emitter and say so").

**m5. Step 7's glow and LED check has no method.** "The server rack LEDs and glows at half alpha": rack glows flicker (`blink`, lighting.js:1121-1123) and dark-room glows also carry the figure fade `e.fade`, so a single read can't show a half. Fix: reuse step 6's ratio method (`reducedMotion = true`, read faded, restore, read full, ratio 0.5 ± 0.01) for one rack. Do it before the `dip` check, which is skipped under reduced motion. LED alpha can be compared with `0.95 * (def.ledAlpha ?? 1)` for an unlit room (`ledLevel` at level 0, :1098).

**m6. Step 4's "player's feet" point is the torch-pool centre.**
- The body is at offset 66 in an 80 px frame (core/player.js:231-232), so the feet are about `player.y + 36`.
- `(player.x, player.y + 6)` is where `stampTorch` centres its pool (`py + 2` with `py = player.y + 4`, :1213, 1223).
- The point is right but the label is wrong. Fix: "the torch pool's centre".

**m7. Risk 2 can be closed.**
- A scan of all maps in `assets/rooms/` checked every rows 0-1 cell where a `room` tile sits over a non-empty `walls` tile: 1,478 cells, cropped from the tileset PNGs.
- None has a pixel with alpha below 250, so hiding the `walls` tile beneath can't change what is seen.
- Fix: record this in §11 and drop risk 2 from slice 2's done-criteria. Risk 1 (N's bottom-row art showing through) still needs the eye check.

**m8. Decision 2's wording reads against the user's phrasing.** "Elevation doesn't enter the test" says the same as the user's "elevation is considered through the drawn rect", but the Opus code reviewer may read it as a departure. Fix: "Elevation counts only through where the sprite is drawn (§4)."

**m9. Real missions are never looked at.**
- AGENTS.md ("Verifying work") asks for "a browser regression across the affected missions" for engine changes.
- This feature runs in every mission on all 147 maps, but the live proof uses four generic maps.
- Risk 1 varies with map art. N's bottom row is its south-wall strip (e.g. room_office `walls` row 9 is 91..100), and the player's feet stand on it in the strip.
- Fix: add to slice 2's live proof one walk along a back wall in two shipped missions: one with bespoke back-wall art (any mission using room_aes_control), and one with a dark north room over a lit south room. Take a screenshot each.

**m10. A desk can fade while items on its lower half don't.** A deep desk whose top edge reaches the strip fades. An item resting on its lower half, with its own drawn top at or below S.y + 64, stays at 1, so a solid item sits on a ghost desk. room_reception's items all reach the strip, so the test scenario won't show it. This follows from decision 8 and isn't a defect in the design. Note it under "Noticed, not in scope" as a question for the user (one option is to fade a table group's members with their table, as companions).

## Verdict

Ready for implementation: slices 1-3 can start now, and only slice 4's §8.1 needs the M1 spill replay folded in before that slice begins.
