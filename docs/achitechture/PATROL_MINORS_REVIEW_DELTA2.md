# Patrol minors: second delta review

Scope: 4ed0eb388 (fixes and tests), 47ea21522 (live harness), 7c4d74993 (doc), tip 7c4d74993. Claim under review: "Delta minors" in section 4 of `PATROL_MINORS.md`. Review only, nothing fixed.

Result: 0 blocking, 0 major, 4 minor. All four earlier minors are fixed in code. The new findings concern a side effect of the arrival move, the harness exit status, and how far the live table proves the player half.

## Checks

**Minor 1 (player-handler test): fixed.** `test/js/npc-patrol-settle.test.mjs:156` drives `handleNPCPlayerCollision` with `window.player.currentRoom` set, so the handler gets past its room check. I copied `js/` and `test/js/` to a scratch directory, deleted only the second `settleGraceRunning` return (`npc-sprites.js:1634`) and reran: test 5 fails with `234 !== 0`, tests 1 to 4, 6 and 7 still pass. The test fails for the right reason and passes on the real tip.

**Minor 2 (arrival before the grace return): fixed, with one side effect (finding 1).**
- Double fire: not possible with the real method. `_triggerGoToStayArrival` clears `_stopOnArrival` and `_goToStayDest` first (`npc-behavior.js:3350` onwards), so the second call hits a false guard. Both handlers return straight after the call, so the older guard at `npc-sprites.js:1511` and `:1702` cannot fire for the same overlap. The unit test (`:187`) stubs the method with a counter and so does not prove this itself, but the code does.
- During a settle: it can fire, and always could. The old guard also ran on first contact (`isSettling` true). Behaviour inside a settle is unchanged for walkers with patrol waypoints.
- Not a regression: the 300 ms settle and the grace are not shortened or extended by the arrival.

**Minor 3 (grace on clockNow, clamped): fixed.** The stamp at `npc-behavior.js:1215` and the reader at `npc-sprites.js:1376` both use `clockNow()`. The clamp (`:1203` to `:1206`) runs before the settle branch, so a bad stamp is pulled back on the next `updatePatrol`. `triggerSettling` (`:3228`) still compares against its `time` argument; the callers in both handlers pass `clockNow()`, so the timelines agree. The clamp only runs while patrol is enabled, which is fine: a walker with patrol off does not use the grace. Test at `:210` covers a differing scene clock and a 1.8e12 stamp.

**Export of `handleNPCPlayerCollision`: nothing wrong.** The only importers of `npc-sprites.js` are `rooms.js` (default `NPCSpriteManager`), `npc-combat.js` and `npc-hostile.js` (`getNPCDirection`). Nothing puts the handler on `window`. The only callers are the collider at `npc-sprites.js:863` and the test. See finding 4 for the missing JSDoc tag.

**Sibling tests, run with `--max-old-space-size=2048`:** `npc-patrol-settle` 7/7, `npc-patrol-clock` 6/6, `npc-behavior-arrival` 4/4. No full suite and no db task run.

## Findings

### Minor 1: the new arrival check is no longer inside the patrol-waypoints block
`npc-sprites.js:1435` and `:1630` run the check for any walker with `_stopOnArrival` and `_goToStayDest`. The guard it duplicates (`:1506` to `:1511`, `:1697` to `:1702`) sits inside the `config.patrol.waypoints.length > 0` block, so before this commit a goToAndStay walker with no patrol waypoints never arrived on a bump. Now it does, in both handlers, whether or not a grace is running. That is probably what is wanted (a bump near the destination is an arrival), but it is a behaviour change outside the stated minor, the doc does not mention it, and no test covers a walker without waypoints (`npc-patrol-settle.test.mjs:50` has waypoints). One related point: when arrival fires on first contact, `triggerSettling` has already set `isSettling`, and `updatePatrol` returns at its first line while patrol is disabled (`npc-behavior.js:1191`), so `isSettling` stays true until patrol is next enabled. That was already so for walkers with waypoints; it now also applies to those without. Add a test and a line in the doc, or move the check back inside the block.

### Minor 2: the live harness exits 0 on every failure except a stuck pause
`tools/playtest/patrol-stall-live.mjs:31` is the only `process.exit` with a non-zero code (2, scene still paused), and it exits without `browser.close()`. A real stand-still, page errors (`errs`), or a clock that did not advance (`clockAdvanced` false, `:63`) only print at `:67` and `:68`, then the script ends with status 0. A caller or a CI step cannot tell pass from fail. Fix: set a threshold (for example `longestStillSecs` above 6 with a settle or grace flag, or any `errs`, or `!clockAdvanced`) and `process.exit(1)`. Also hardcoded, and fragile on any other machine or after the `p-9-2-h` worktree is cleaned: the Playwright `require` root at `:9` points into another worktree, and the Chromium path at `:11` is a fixed cache path.

Escape handling is sound. It presses Escape only inside the loop at `:30`, only while the scene reports paused, at most three times, then aborts. It never presses it blindly.

### Minor 3: the nine live runs support "no settle stall" but not the player half
- The table is not reproducible: the per-second JSON (`out.json`) is not committed or linked, so the readings cannot be rechecked, and the doc does not say how "Settle or grace flag in the stretch" was derived beyond the harness summary fields.
- No `ahead` run on the unfixed code, so runs 7 to 9 do not show the mode would have stalled before the fix. They show the new code does not stall, not that the player handler's guard changed anything live. The unit test (finding on Minor 1 above, fails 234 to 0) is the real proof for that half.
- Runs 7 and 8 stood 4 s with `_playerBeside` true and no grace, so they sat in the player-wait path, not in repeated `handleNPCPlayerCollision` calls inside a grace. The line "Run 7 and 8 are the first live exercise of the player-collision half" is stronger than the data. Run 9 is the only `ahead` run with a grace flag, and it lasted 3 s.
- The doc says the 4 s stretches end at "the 5 s `_patrolStalled` re-target"; at 1 s sampling a 4 s stand-still is consistent with that, but the doc does not say so, and the park-mode 5 s stretch from the earlier section is now shown as 2 to 3 s without comment.
- Nine runs of 120 s in two modes on one pair is adequate as supporting evidence. Say so in the doc rather than "the fix is proven live".

### Minor 4: export lacks the "private, exported for unit tests" tag
`npc-sprites.js:1604` is now exported, but unlike `handleNPCCollision` (`:1389` to `:1396`) and `settleGraceRunning` (`:1373`) its JSDoc has no `@private exported for unit tests` line. Cosmetic, but it is how this file marks the exports that must not become API.
