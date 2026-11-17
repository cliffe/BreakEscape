# m03 office life slice 7: seats and pose frames (done)

Branch fix/ol-m03-night-sofa (main with the pose art is already merged in). First pass: game 6752. Fix and remaining items: games 6757, 6765 and 6766. Keyless server on :3091, each puma stopped by its recorded PID. The fix changes seating.js (startMount and seatNPC) and adds test/js/seating-post-side-place.test.mjs; no scenario or art file changed. Scratchpad (not in the repo): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/slice7/` holds lib.mjs, p1.mjs, p2.mjs (seat dump and zoomed crops), cyc.mjs (stand/walk/re-sit cycles with a 200 ms sampler), s4.mjs (player beside Zainab; run, game 6766, item 4), rl.mjs (reload while both seated; run, game 6766, item 5), an.py and away.py (analysis), the sample JSON files and the PNGs.

## Done

### 1. Seats by day: pass
Screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/slice7/seat-both-wide.png`, `seat-zainab_hussain-breathdown.png`, `seat-zainab_hussain-breathup.png`, `seat-yusuf_demir-breathdown.png`, `seat-yusuf_demir-breathup.png`.
- Zainab: sofa leather_sofa1 (129,228), place 0 (west), facing south, frame sit_south_frame_000, sprite (148,241), depth 266.51 over the sofa 266.5. Drawn over the sofa back, head above it, shoes below the front edge. No wrong overlap of the arm.
- Yusuf: club_chair_e1 (90,254), facing east, sit_east_frame_000, sprite (111,268), depth 300.51 over chair 300.5. Back of the chair to the west, clean.
- Breath: the pixel diff between the up and down crops is confined to the rows above the cut (head and shoulders), nothing below, no seam or gap. Aligned.

### 2. Stand, walk, re-sit, 3 cycles: Yusuf pass, Zainab MAJOR finding
Data: coffee1-samples.json (3 Zainab coffee, 3 Yusuf coffee), pair1-samples.json (3 cooler pairs, 3 coffee pairs).
- Yusuf: always re-sits at club chair place 0, sprite (111,268), facing east, 12 of 12 cycles. Stand spot feet (106.6 to 108, 287.6 to 298): within 11 px, no drift.
- Zainab, FINDING 1 (major): her re-sit place depends on the side she returns from. Back from the cooler (north door, west side) she takes place 0 (sprite 148,241). Back from the coffee machine (east side) she takes place 1 (sprite 172,241), 24 px east, and stays there. Her first coffee return in each run flips her. Evidence: coffee1 intervals 0 then 1 to 4 (148 then 172); pair1 intervals 0 to 3 at 148, 4 to 6 at 172 after the first coffee return. Cause: `seating.js` `seatNPC` calls `takePlace(chair, seat, npcId, standFeet)` with the NPC's feet at the moment of sitting (nearest free place), not the post cell. Her walk to the post ends within a tile of it, so arriving from the east she is about 28 px east of 148 and the nearer place is 1. Fix proposal (engine, not applied, not mine to decide): in `seatNPC` pass `opts.standAt` (the needs ref, the home cell when within POST_SNAP) to `takePlace` when present; then add a test in test/js and re-prove with cyc.mjs (all re-sits at place 0 from both sides). A scenario-only change cannot fix it (post at either place still flips from the other side). Consequence today: the free place for the player is 1 after a cooler trip and 0 after a coffee trip.
- Stand spots (feet): Zainab (148,253 to 264) from place 0, (162.6 to 172, 259 to 264) from place 1; both are south of the sofa, clear of the table (y 272).

### 3. Pairings: pass
Both at the machine together: coffee 3 of 3 pair runs (use_started within 0.3 to 1.7 s of each other), npc_exchange_heard fired (ex_tailgate, and ex_open_door in coffee1), npc_chatted 17 events in pair1. Cooler: together in 1 of 3 (use_started 172.2 and 174.0); in the other two the second user went 15 to 50 s later (single file door, known from R1). Page errors: none seen.

### 6 (partial). Real away times (global zainab_laptop_owner_away)
| Value | SLICE3_4.md | Now |
|---|---|---|
| Coffee real away | 22.0 to 22.4 s | 22.0, 22.4 (place 0 start); 22.0, 22.0, 22.2 (coffee1) and 20.6, 19.2 (pair1) from place 1 (only the pair1 ones are shorter) |
| Cooler real away | 32.2 to 33.0 s (alone) | 33.2, 33.1 (first trip of each run, before she had sat: no place, she leaves from the spawn walk-in), 29.5, 29.6 (place 0 start). The two long ones are start-of-run trips, not place-1 starts: the samples show no seat before them. |
| Cooler real away, Yusuf joins late | 50.9 to 58.5 s | 58.4 |
| Lock at 1.2 s after leaving | coffee open, cooler locked | coffee open (7 of 7), cooler locked (5 of 5) |
Coffee expected 18.6 s and cooler 28.7 s (expectedAwayMs): NOT re-measured; my sampler read the wrong job field (null). Read it from the npc_left_post event payload (`expectedAwayMs`, workstation-state.js:544) in pair1-samples.json or a rerun. The 24 s lock threshold still separates coffee (max 22.4) and cooler (min 29.5) by real time. Finding 2 (minor): a place-1 start shortens the coffee trip to 19.2 to 20.6 s; this goes away with the finding 1 fix.

## Fix for finding 1 (engine, commit a3a52b3de)

Cause: two places picked the sofa place from the feet at that moment, not from the post.
- `public/break_escape/js/systems/seating.js:1494` (`startMount`): `freePlaces(chair, seat, bodyFeet(sprite))`, so the walk target was the place nearest her feet. `needsSeatRef` already hands the home cell as `opts.ref` (the feet when she is not near the post).
- `seating.js:1613` (`seatNPC`): `takePlace(chair, seat, npcId, standFeet)` took the place nearest the feet she stopped on, ignoring `opts.standAt`.
Fix: `startMount` uses `m.opts.ref || bodyFeet(sprite)`, `seatNPC` uses `opts.standAt || standFeet`. Taken place keeps the old behaviour (`freePlaces` returns the nearest free one), no stand cell falls back to the feet. General: any needs NPC with a multi-place seat.
Test: `test/js/seating-post-side-place.test.mjs` (3 tests: far-side arrival takes the post-side place; no stand cell takes the nearest to the feet; post-side place taken falls back to the other). Before the fix test 1 fails (`expected: 0, actual: 1`), after: 3 of 3 pass. The `startMount` half is proved live only (the walk needs physics).

## Live proof of the fix (keyless :3091, game 6757, driver cyc.mjs, plan z:caffeine, z:thirst, b:caffeine, y:thirst, z:caffeine, b:thirst)
- Zainab: 6 re-sits, all place 0, sprite (148,241), `sit_south_frame_000`. Coffee returns (3, from the east side, arrival feet 158.6, 151.1, 151.4) and cooler returns (2, plus the first one at start) all west. Before the fix the first coffee return flipped her to place 1 (172,241) for good.
- Yusuf: 5 re-sits, all club chair place 0, sprite (111,268), `sit_east_frame_000`.
- Page errors: none.

## Slice 7 items
- Item 4 (s4.mjs, game 6766, player seated beside Zainab): PASS. Zainab on place 0, the player took place 1 (sofa `full`). She stood in 0.26 s (not blocked), took a coffee trip (23.7 s), re-sat on place 0 with the player still on place 1, no overlap in the crops (`slice7/s4c-player-beside.png`, `s4c-after-resit.png`). Closest approach of her feet to the player's seated feet, 9.2 px, during the final step into her stand cell (148,264): the seated bodies are 24 px apart and neither moved. Note: if the player takes place 0 while she is away (games 6757 and 6765, she leaves within seconds of the start for the cooler), she returns to place 1 (the fallback), as intended.
- Item 5 (reload while both seated, rl.mjs, game 6766, two reloads): PASS twice. Both seated at once and after settling: Zainab place 0, (148,241), `sit_south_frame_000`, depth 266.51; Yusuf place 0, (111,268), `sit_east_frame_000`, depth 300.51; sofa `_places` {0: zainab}, no stale seats.
- Item 6 (re-measure, fix-samples.json): below.

## Measurements (after the fix, game 6757)
| Value | SLICE3_4.md (R1) | Now |
|---|---|---|
| Coffee expectedAwayMs (`npc_left_post` payload) | 18626 | Zainab 18626 (x3), Yusuf 19752 |
| Cooler expectedAwayMs (payload) | 28724 | Zainab 28724 (x2: z:thirst and b:thirst), Yusuf 29000 (x3) |
| Coffee real away (global `zainab_laptop_owner_away`) | 22.0 to 22.4 s | 22.2, 22.0, 25.2 (Yusuf at the machine too) |
| Cooler real away | 32.2 to 33.0 s alone, 50.9 to 58.5 s with Yusuf | 27.8 (start trip, alone), 29.0 (z:thirst, alone), 29.8 (b:thirst, paired). Only the last is paired: Yusuf's cooler uses at t=176.8 s (y:thirst) and t=243.5 s sit beside Zainab's only at the b:thirst trip. |
| Lock 1.2 s after leaving | coffee open, cooler locked | coffee open (3 of 3), cooler locked (3 of 3) |
| Coffee use cell (feet) | (276,244) | Zainab (273.9,243.8), (269.4,244), (270,244); Yusuf (236.7,244) |
| Cooler cells (feet x, y) | x 198 and 234 | (197.3 to 198.8, -44 to -42.7) and (233 to 233.7, -44 to -42.1); one at 194.5 |
The 24 s lock threshold still separates coffee (max 25.2 real, but expected 18.6 to 19.8 s, and the lock decision uses expected) from cooler (expected 28.7 s). Cooler real away from a seated start is 29.0 to 29.8 s in all five post-seat trips (29.5, 29.6 first pass; 29.0, 29.8 after the fix), unchanged by the place fix. The longer first-pass values (33.1, 33.2 s) are start-of-run walk-ins before she had sat, and the 27.8 s start trip after the fix is the same kind. SLICE3_4's 32.2 to 33.0 s is not reproduced by any trip from a seat in these runs. On coffee, the place-1 start shortening (finding 2) is gone. The 25.2 s coffee case is Zainab and Yusuf together at the machine (capacity 2); the laptop stayed open at 1.2 s and is not re-checked later, so nothing relies on it ending before 24 s. useFrom is unchanged and her post cell and stand cell are the same on every cycle: stand spot feet (148,252 to 264) each time.
Yusuf stand spot feet (108 to 108.3, 287 to 298), same as before.

The cooler has three real away values (27.8, 29.0, 29.8 s) but two expectedAwayMs payloads: only z:thirst (left_post at t=104.0 s) and b:thirst (t=237.1 s) logged an `npc_left_post` with the payload. The 27.8 s start-of-run cooler trip (use_started at t=32.1 s) ran before the driver's sampler marks began (first mark t0=74.4 s), so it logged no `npc_left_post` and has no payload. Its lock was read, like all three, from the sampled laptop-lock flag (`lk` true in fix-samples.json), which is how "cooler locked (3 of 3)" was counted; the expected-time payload is not needed to read the lock.

## Not done
Nothing in slice 7. The earlier "Draft nothing else until Finding 1 is decided" is now closed: no scenario change was needed.
