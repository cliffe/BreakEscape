# M03 review, round 10 (delta)

Scope: `git diff b4b7c5119..f7218abfb`, limited to the branch's own commits. The main merge (7f688093d) is left out.

- 25a66c8f3: `seating.js` `resetNeedsSeatGate` on an instant unseat that ends a seat move or fetch (R9 m1, n1).
- a3a52b3de: the place choice. `startMount` uses `m.opts?.ref || bodyFeet(sprite)` and `seatNPC` uses `opts.standAt || standFeet`. Adds `test/js/seating-post-side-place.test.mjs`.
- 47d281283, 11e8feb52, f7218abfb: `SLICE7_SEATS_POSES.md`.

This was a read-only review. I ran `node test/js/seating-post-side-place.test.mjs` (3 of 3 pass) and `node test/js/npc-hide-seated-breath.test.mjs` (13 of 13 pass). I started no server and created no game.

Note on tiering: R9 itself counted 0 majors. The major that puts this round at the review tier is slice 7 finding 1 (Zainab re-sitting on the east place), which a3a52b3de answers.

## Place choice, by caller

Only two-place seats exist: `leather_sofa1`, `uni_sofa2` and `hce_bench1` (`seating.js:165-167`). For a swivel chair with a body, `startMount` skips the place pick, and `freePlaces` on a seat with no `places` returns `[0]` (`seating.js:270-271`). So the change only matters on a sofa or bench.

| Caller | ref / standAt passed | Effect of the change |
|---|---|---|
| Player sitting | `takePlace(chair, seat, 'player', approach)` (`seating.js:415`) | None. Not touched. |
| Plain (non-needs) seated NPC, and a scenario `seated` NPC at load | `chairsNear` from the feet, then `seatNPC(behavior, found.obj, cfg)` (`seating.js:1986`). `cfg` is the raw scenario `seated` object, with no `standAt` | None. Falls back to `standFeet`, the same as before. The scenarios use only `chair`, `facePlayer` and `maxDistance` (test_seating, lab_physical_pentest). |
| Needs seat at the post, feet within POST_SNAP (48 px) of home | `ref` = home cell (`needsSeatRef`, `seating.js:2217-2223`, used at 2393 and 2413) | The intended fix. `startMount` walks to the place nearest home, and `seatNPC` takes the same place (`standAt: opts.ref`, `seating.js:1570`). |
| Needs seat away from the post, or feet more than 48 px from home | `ref` = feet at the moment of the decision | No real change. For a static seat `startMount` runs in the same tick as `startSeatMove` (`seating.js:1461-1462`), so `ref` equals `bodyFeet` and the walk target is the same place as before. `seatNPC` now picks from `ref`, the start feet, where it used to pick from the arrival feet. Both give the place that was walked to, unless that place was taken during the walk. If it was, the only other free place on a two-place seat is the same either way. |
| Far ref | n/a | The ref cannot be far from the seat. `chairsNear(..., NEAR_CHAIR)` (36 px, `seating.js:2024`, 2410) keeps a seat only if its nearest free place to the ref is within 36 px, and `startMount` then picks the same nearest free place from the same ref. Past the 48 px gate the ref is the feet, as above. |
| Reload and restore | No seat state is saved; the needs path re-sits from scratch | As in the post row. Slice 7 item 5 shows place 0 after two reloads. |
| Night turn (instant unseat, then show) | An instant unseat lands the feet on `standAt` (`seating.js:1686`, 1693), the home cell, and resets the gate | On show, `needsSeatRef` returns home, so the place is the post-side one. Before the fix the feet were also at home, so this path behaves as it did. |
| Fetch | `ref: f.spot` (`seating.js:2479`). A fetch is swivel-with-body only (`seating.js:2419-2420`) | None. A swivel seat has no `places`. Swivel `walk` still rewrites `m.opts.ref` to where the walk ended (`seating.js:1544`), but `standAt` was already `opts.ref` before this commit. |
| Pair side swap (`npc-needs.js:3415` `_sideBlocker`) | Changes `job.dest` at a capacity-2 use target (coffee, cooler), not the post | None. A seat at a non-post stop takes the "away from the post" row. |

Blocked or unreachable places: a place taken by anyone is filtered out by `freePlaces`, so the fallback is still the nearest free place (test 3). The one new failure route is a post-side place that is free but cannot be reached on foot. See n5.

## Findings

### m1 (minor): no unit test pins the `startMount` half, and one can be written without physics

`seating.js:1494` decides where the NPC walks. `seating-post-side-place.test.mjs` only tests `seatNPC` (`seating.js:1613`). If the `startMount` half regressed and the `seatNPC` half stayed, the NPC would walk to the east place and then `poseSprite` would snap it 24 px west onto place 0. Every current unit test would still pass, and the player would see a visible jump. The live proof (SLICE7, "Live proof of the fix") covers m03 Zainab only.

No physics is needed for this. For a static seat, `startSeatMove` calls `startMount` synchronously, so `behavior._seatMove.target` is set by the first `updateSeatedNPC` call. `test/js/seating.test.mjs` already has a needs rig (`labSeatRig`, at line 185) that stubs `npcNeedsSystem`, `npcManager` and `rooms` and drives `updateSeatedNPC` up to "walking onto the seat" (line 213). Two tests could be added using a `leather_sofa1` in place of the swivel:

1. Home at place 0's foot and feet about 25 px east (inside POST_SNAP). After one `updateSeatedNPC`, `_seatMove.target.x === placeFoot(place 0).x`. This fails before a3a52b3de.
2. The same layout with `stop.post` false. The target is the place nearest the feet, which pins the "away from the post" row above.

No design decision.

### n1 (nit): the Zainab habit comment in m03 still says the cooler takes "about 32 s"

`scenarios/m03_ghost_in_the_machine/scenario.json.erb:828`: "cooler (use 20) expectedAwayMs about 28.7 s, real about 32 s". SLICE7 now measures 27.8 to 29.8 s. The lock rule runs on `expectedAwayMs` (`workstation-state.js:157`, 404, 544), and expected is unchanged at 28724 ms. So the comment is out of date but nothing needs retuning (see "Checks answered"). Change it to "real about 28 to 30 s".

### n2 (nit): the SLICE7 opening note contradicts items 4 and 5

`SLICE7_SEATS_POSES.md:3` still lists "s4.mjs (player beside Zainab; written, NOT run)" and does not list `rl.mjs`. Line 45 reports s4.mjs as run (game 6766, PASS) and line 46 reports rl.mjs as run. The f7218abfb correction fixed the rest of that line but missed these two.

### n3 (nit): the SLICE7 measurement table labels and counts do not line up

In the "Measurements (after the fix, game 6757)" table:

- The cooler real away row says "27.8, 29.0, 29.8 (paired)". The driver plan (`z:caffeine, z:thirst, b:caffeine, y:thirst, z:caffeine, b:thirst`) has one Zainab-only thirst trip (`z:thirst`) and one paired trip (`b:thirst`). The live-proof section also mentions a third cooler trip at the start. They cannot all be paired. Mark which value is which.
- Cooler `expectedAwayMs` has 2 payloads ("x2"), but there are 3 real away values and "cooler locked (3 of 3)". Say which trip has no payload (presumably the start trip, before the sampler hooked in) and how its lock was read.
- The reason given for the shorter cooler trip ("she no longer detours to the east place") fits the first-pass numbers: 33.2 and 33.1 s from a place-1 start, 29.5 and 29.6 s from a place-0 start. The first-pass table does not mark which start each value came from, though. One line there would make the comparison checkable.

The claims hold apart from these labels. Coffee expected 18626 (x3) matches 3 coffee trips. The lock decisions match the 24 s rule on expected values. The coffee use cells (269.4 to 273.9, 244) are within 7 px of R1's (276, 244). Yusuf's (236.7, 244) is the side cell of a pair. Item 4's coffee trip of 23.7 s is longer than the 22.0 to 22.2 s of the other runs but still under 24 s, and the lock is decided on expected time anyway.

### n4 (nit): the fetch branch of the R9 m1 gate reset has no test

The new test (`npc-hide-seated-breath.test.mjs:232`) hides a needs NPC mid walk. The `_fetch` half of `needsEnded` (`seating.js:1654`) is reached by the mid-fetch tests at 197 and 212, but they do not assert the gate fields. Add the five gate assertions to the test at 197.

### n5 (nit, unproven): a post-side place that cannot be reached now gives up instead of sitting on the near place

Before the fix, an NPC stopped east of its home took the nearer east place. Now it walks laterally to the post-side place, up to about one place width (24 px) plus the arrival offset. If something standing (the player, or an NPC on a use cell) blocks that walk more than `STATIC_REACH_PX` (28 px, `seating.js:403`) from the target, `mount_stuck` (`seating.js:1565`) ends the move. The NPC then stands until the post retry, where it would previously have sat on the free near place.

In the m03 runs the arrival feet were x 151 to 159 against a target of 148, well within reach. Item 4 (player seated on place 1) passed with the walk going past the player's seated block. A standing player is not covered. The consequence is a standing spell followed by a retry, which is the same outcome as any other blocked seat. No change is asked for. If a check is wanted, a scripted live run with the player standing just west of Zainab's home cell as she returns from coffee would answer it.

Possible design decision (flagged, not decided): should a blocked post-side place fall back to the other free place on the same seat (try the next entry in `freePlaces` before `mount_stuck`)? That would bring back the old "sit somewhere" outcome without bringing back the flip. It belongs to AC0 only if n5 shows up live.

### Carried from R9

R9 n2 (the `_sideBlocker` pre-check rebuilds `taken` by hand, `npc-needs.js:3459-3465` against 3398-3401) is not addressed. It was optional and is still optional.

## Checks answered

- **R9 m1 gate reset, complete?** Yes. `needsEnded` is computed before `endSeatMove` and `cancelFetch` clear the records (`seating.js:1654`), and it is applied after (1660). The helper clears `_seatStopKey`, `_seatTriedAt`, `_seatRetries`, `_seatGaveUp` and `_seatGaveUpAt`. With `_seatStopKey` null, `updateNeedsSeat` on show takes the new-stop path, which also clears `_fetchTriedAt`, `_fetchRetries` and `_seatGiveUpExpiries` (`seating.js:2367-2374`). No stale `_seatGaveUp` can survive. A step move has no `stopKey`, so hiding mid-step does not reset the gate. That is correct: a step only follows a non-instant unseat, and that unseat comes from a stop change (a new key on the next stop anyway) or from a lost chair, where a non-hidden NPC keeps its gate too. A chair's `fetchedBy` stays set after a cancelled fetch, but it expires after `FETCH_CLAIM_MS` (`seating.js:2271-2274`) and is ignored for the NPC that set it.
- **Tests prove the change?** For `seatNPC`, yes. Test 1 puts the feet at x 128, nearer place 1 (foot 123) than place 0 (foot 99), so before the fix `standFeet` picks place 1. It therefore fails before the fix, as SLICE7 states. Tests 2 and 3 cover the no-ref case and the taken-place fallback. For `startMount`, see m1. The live numbers (6 of 6 re-sits on place 0, three of them coffee returns from the east with arrival feet 151 to 159) prove m03, but nothing would catch a regression in CI.
- **m03 timing retune?** None needed. Lock: `decideLocked` compares `expectedAwayMs` to `lockIfAwayOverSeconds * 1000` (`workstation-state.js:155-157`). Expected is unchanged (coffee 18626 ms, cooler 28724 ms), so it stays 5.4 s under and 4.7 s over 24 s. Real cooler time (27.8 to 29.8 s) does not enter the rule. The laptop has no `autoLockSeconds` and m03 has no policy, so the coffee case with Yusuf at the machine (25.2 s real) stays open, as SLICE7 says. The away text window ("lasts over 20 s", `scenario.json.erb:643-644`) still holds at 22.0 to 22.2 s. Barks and triggers: `npc_caught_at_post:zainab_hussain` has a 30 s cooldown (`:855`), and the thirst and caffeine pushes (`:853`, `:854`, `:893`, `:894`) have 120 to 150 s cooldowns. None is keyed to trip length. Only the comment in n1.
- **Regressions elsewhere?** Needs scenarios with a multi-place seat: test_needs_sims `lounge_sofa` (`scenario.json.erb:923`), used by Grace and Rosa as a rest target, which is a non-post stop where `ref` is the feet, so nothing changes. test_seating's `leather_sofa1` (`:327`) holds a scripted seated NPC, which is not changed either. Room maps for m03, lab_physical_pentest and test_seating list the sofa and bench images. I did not check whether any needs post sits beside one. Where one does, the new behaviour, post-side place every time, is the intended general rule. A new key in a scenario `seated` object called `standAt` would now steer the place, but no scenario uses that key. No harness copy-list change is needed: the new test imports `seating.js` directly and `bin/test-js` globs `test/js/*.test.mjs`.

## Counts

blocker 0, major 0, minor 1, nit 5.

## Verdict

The main fix is correct for every caller. It only changes the place for a needs NPC at its post within 48 px of home, and every other caller resolves to the old choice. The R9 m1 gate reset is complete. The m03 lock and bark timings need no retuning. The branch can merge once m1 (a `startMount` unit test on the existing `labSeatRig`) is added. The nits can ride along or go to the slice notes. n5 is a possible design question only if it shows up in a live run.
