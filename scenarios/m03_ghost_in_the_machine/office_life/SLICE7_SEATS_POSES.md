# m03 office life slice 7: seats and pose frames (partly done, handed over)

Branch fix/ol-m03-night-sofa (main with the pose art is already merged in). Game 6752, keyless server on :3091 (puma PID 412712, killed by PID at the end). No scenario, engine or art file was changed. Scratchpad (not in the repo): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/slice7/` holds lib.mjs, p1.mjs, p2.mjs (seat dump and zoomed crops), cyc.mjs (stand/walk/re-sit cycles with a 200 ms sampler), s4.mjs (player beside Zainab; written, NOT run), an.py and away.py (analysis), the sample JSON files and the PNGs.

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
| Coffee real away | 22.0 to 22.4 s | 22.0, 22.0, 22.0, 22.2 (place 0 start) then 22.4, 20.6, 19.2 (place 1 start, shorter) |
| Cooler real away | 32.2 to 33.0 s (alone) | 33.2, 33.1, 29.5, 29.6 |
| Cooler real away, Yusuf joins late | 50.9 to 58.5 s | 58.4 |
| Lock at 1.2 s after leaving | coffee open, cooler locked | coffee open (7 of 7), cooler locked (5 of 5) |
Coffee expected 18.6 s and cooler 28.7 s (expectedAwayMs): NOT re-measured; my sampler read the wrong job field (null). Read it from the npc_left_post event payload (`expectedAwayMs`, workstation-state.js:544) in pair1-samples.json or a rerun. The 24 s lock threshold still separates coffee (max 22.4) and cooler (min 29.5) by real time. Finding 2 (minor): a place-1 start shortens the coffee trip to 19.2 to 20.6 s; this goes away with the finding 1 fix.

## Not done (for the next agent)
- Item 4: run `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/slice7/s4.mjs 6752 s4` (player sits beside Zainab, she stands for coffee while the player sits, min distance, no block, re-sit place, crops). Needs the Finding 1 context: with Zainab on place 0 the player takes 1.
- Item 5: reload while seated (reload the page twice in a game; both should come back seated at their spawn: Zainab place 0, Yusuf chair place 0).
- Item 6: useFrom and lane numbers (queue cells, use cell (276,244), cooler cells x 198 and 234) and expectedAwayMs as above.
- Suites not run (no code or data changed). Draft nothing else into scenario files until Finding 1 is decided.
- Handover: server stopped; commit of this file only.
