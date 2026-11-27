# M03 review, round 11 (delta)

Scope: `git diff 0f2a4010e..41bce6c67` (f910e086e, 41bce6c67). The main merge 6b5f6baa6 is left out. Read-only review: I ran `node test/js/seating.test.mjs` (82 of 82 pass) and `node test/js/npc-hide-seated-breath.test.mjs` (13 of 13 pass). No server, no game, no edits. Sample data re-read from the scratchpad `slice7/` JSON (fix-samples.json, pair1-samples.json, coffee1-samples.json) with a throwaway script; SecGen, credentials and field guides not opened.

Counts: 0 blockers, 0 majors, 1 minor, 2 nits. No finding adds a design decision.

## R10 findings, checked

### m1 (startMount walk-target tests): fixed
- The tests do exercise `startMount`. `m.target` is assigned in exactly one place, `startMount` (`public/break_escape/js/systems/seating.js:1496`). `seatNPC` does not set it. On the first `updateSeatedNPC` call a static seat goes `startSeatMove` -> `startMount` (seating.js:1462), so `_seatMove.target` read in test/js/seating.test.mjs:257-258 and :267-268 is the `startMount` output.
- The rig is realistic. `sofaRig` (seating.test.mjs:233-251) makes a 62x40 `leather_sofa1` at (80,90) with places at feet x 99 and 123, and the faced object `staff_pc_2` at (111,400), due south, so the south seat counts as facing it. Feet at 124 are nearer place 1; home (99,127) is 25 px away, inside `POST_SNAP` 48 (seating.js:2025, `needsSeatRef` :2217).
- At-post case: `atPost: true`, mode idle, so `needsStop` gives `post: true` (seating.js:2078), `needsSeatRef` returns home, and the target is place 0 (x 99). With the old code (feet as the reference) it would be place 1, so this test fails without the fix.
- Away case: `mode='job'`, a `use` job at `sofa_stop`, `atPost=false`, phase `using`. `needsStop` returns `post: false` (seating.js:2076, `sofa_stop` is not the home id), so the reference is the feet and the target is place 1 (x 123). It is driven by a non-post `use` job as asked. This case passes with or without the fix; it guards the other branch against regression, which is its purpose.
- Both tests assert a target exists first, so a missing `_seatMove` fails clearly and not on `undefined`.

### n4 (gate-field asserts): fixed
- npc-hide-seated-breath.test.mjs:203-207 sets `_seatStopKey='desk:1'`, `_seatTriedAt=5000`, `_seatRetries=2`, `_seatGaveUp=true`, `_seatGaveUpAt=6000` before the hide. Each is non-default, so the asserts at :217-221 (null, 0, false, undefined, undefined) show a real reset. Reset values match what the other tests in the file read as defaults.

### n1, n2, n3: partly fixed, one claim still unsupported (m1 below)
- n2 (item 4 and 5 run, s4.mjs and rl.mjs): SLICE7_SEATS_POSES.md:3. Accurate; matches the Items section.
- n3 (payload counts): SLICE7:53 "x2: z:thirst and b:thirst" and the added paragraph at :61 are correct against fix-samples.json events. Zainab's `npc_left_post` payloads at 104.0 s (z:thirst) and 237.1 s (b:thirst) carry 28724. The start trip has none; its `npc_use_started` is at 32.1 s. Yusuf's cooler uses are at 46.5, 176.8 and 243.5 s; only 243.5 s falls beside Zainab's (242.1 s) at b:thirst. "Only the last is paired" holds. The lock count reads from the `lk` samples, as the paragraph says.
- n1 (first-pass cooler row, SLICE7:26): the correction itself is right. In pair1 and coffee1 the first cooler trips (33.1 s, 33.2 s) start with no seat ever seen before them (first sample already has `g` true, Zainab walking to the cooler with seat null). The place-0 trips are 29.5 and 29.6 s. See m1 for what that does to the reasoning.

### n5 (backlog line): fixed
- docs/IDEAS_BACKLOG.md:285 sits directly under the capacity-2 stall line (:284). Accurate: `mount_stuck` is at seating.js:1565 with `STATIC_REACH_PX` 28 (:403); `freePlaces` returns the free list sorted by distance (:270-279), so "try the next entry in `freePlaces`" is a workable fix; arrival feet 151.1 to 158.6 against 148 matches SLICE7 :23 ("arrival feet 158.6, 151.1, 151.4") and the Slice 7 items (item 4: the seated player did not block). It is marked unproven, correctly.

## New findings

### m1 (minor): "she no longer detours to the east place" is not supported by the data
- Where: SLICE7_SEATS_POSES.md:59 ("Cooler real away is shorter than in SLICE3_4 (29 against 32 s) because she no longer detours to the east place: the place-1 start shortening (finding 2) is gone."). It was left unchanged when the n1 row was corrected. The scenario.json.erb:828 comment does not contain this sentence; it says only "real about 28 to 30 s" (see n1 below).
- Evidence, last seat before each cooler trip (script over the three sample files):
  - First pass: 33.1 s (no seat, start-of-run), 29.5 s (place 0), 58.4 s (place 0, Yusuf joined late), 29.6 s (place 0); coffee1 33.2 s (no seat, start-of-run).
  - After the fix: 27.8 s (no seat, start-of-run), 29.0 s (place 0), 29.8 s (place 0).
  - No cooler trip in any file starts from place 1. The place-1 starts that exist are all coffee trips (coffee1 92.9, 152.2, 185.4 s; pair1 234.6 and 264.4 s).
  - Post-seat cooler trips are 29.5 and 29.6 s before the fix and 29.0 and 29.8 s after: no change. The long 33.1 and 33.2 s values come from the start-of-run walk-in, not from a detour.
- So the sentence is not supported. Nothing in these data shows a place-1 cooler start, so there is nothing for the fix to have shortened. The 29 against 32 s gap is better explained by SLICE3_4's 32.2 to 33.0 s figures being start-of-run style trips or a different run, which this data cannot settle either way. Also note the start-trip durations are lower bounds: the sampler began with `g` already true (first sample t=26.9 to 28.9 s, Zainab mid-walk), so the trip began earlier than the number counts from.
- Corrected wording, data only: "Cooler real away from a seated start is 29.0 to 29.8 s in all five post-seat trips (29.5, 29.6 first pass; 29.0, 29.8 after the fix), unchanged by the place fix. The longer first-pass values (33.1, 33.2 s) are start-of-run walk-ins before she had sat, and the 27.8 s start trip after the fix is the same kind. SLICE3_4's 32.2 to 33.0 s is not reproduced by any trip from a seat in these runs."
- Related, same sentence's neighbour: the clause "the place-1 start shortening (finding 2) is gone" is true for coffee (see n2 below), but is not a cooler fact; move it to the coffee row.
- Not a design decision: wording only. The lock logic uses `expectedAwayMs` (28.7 s against the 24 s threshold), so no behaviour depends on it.

### n1 (nit): the scenario comment's "about 28 to 30 s" includes the start trip
- scenario.json.erb:828. Of the values behind it, 27.8 is a start-of-run trip (lower bound) and the five post-seat trips are 29.0 to 29.8. "about 29 to 30 s" is what the post-seat data shows. Harmless: the comment's point (cooler locks at 24 s, about 5 s above and below) holds either way. Optional.

### n2 (nit): coffee row place labels in the first-pass table
- SLICE7_SEATS_POSES.md:25 says "22.0, 22.0, 22.0, 22.2 (place 0 start) then 22.4, 20.6, 19.2 (place 1 start, shorter)". By last seat before departure: place 0 starts are 22.0 (coffee1, first) and 22.4 (pair1); place 1 starts are 22.0, 22.0, 22.2 (coffee1) and 20.6, 19.2 (pair1). So the 20.6 and 19.2 s trips are the only shortened ones, both in the paired run; coffee1's place-1 trips are not shorter. "Place 1 start shortens the coffee trip" is true only for pair1 and may owe more to the pair. Predates this delta (the row was edited for the cooler cell only), and the finding is closed by the fix, so it is a label correction, not rework. Suggested wording: "22.0, 22.4 (place 0 start); 22.0, 22.0, 22.2 (coffee1) and 20.6, 19.2 (pair1) from place 1 (only the pair1 ones are shorter)".

## Design decisions
None added. All three findings are wording in docs or a comment.

## Verdict
Clean. The R10 minor and nits m1, n4 and n5 are properly fixed; n1 to n3 are fixed in form but leave one unsupported causal sentence at SLICE7:59 (minor), plus two optional wording nits. No code change needed. After the minor wording fix this is ready.
