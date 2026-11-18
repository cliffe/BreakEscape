# m07 office life: build review log

## Build review R1 (counts at review: B0 M1 m8)

| Finding | Class | Outcome |
|---|---|---|
| M1 cooler pulls the supervisor's chair | M | Fixed in data: `"seat": "stand"` on the ops_cooler affordance. Live: passed (games 8180, 8186), no seat_move, no mount_stuck, other chairs unchanged. |
| m1 "playing up" in Gwen's opener | m | Fixed: "acting up"; ink recompiled, SPOKEN_LINES.md updated, DIALOGUE_REVIEW_OL.md follow-up logged; dialoguelint run. DIALOGUE_SAMPLE.md did not quote it. |
| m2 chair hit box over a seated NPC | m | Recorded in HANDOVER.md as an engine follow-up; no data fix. |
| m3 one punch can hit both operators | m | Accepted; line added to BUILD_LOG.md. |
| m4 hostile leash too long | m | Fixed: `chaseRange` 200 on both operators. Live attack run passed (games 8202, 8206, 8210): hostile, chases near post, back at post when the player is 270 px away. |
| m5 L1 and 10.1 not run on the real route | m | DONE 2026-11-18: games 8225 and 8229, both seated at post for 45 s from first entry, HaX text, Architect ring and RFID text seen, no chatter, both hidden on server-room arrival. See LIVE_SLICE3.md "R1 m5 walkthrough run". |
| m6 stale BUILD_LOG sections, 3.9 note | m | BUILD_LOG sections marked resolved with commits; LIVE_SLICE3.md note corrected to ratio 1.0. |
| m7 PLAN thirst initials | m | PLAN 2.4 and 2.9 now 40 and 55 with the measured first trip (about 82 s). |
| m8 credits capitals | m | Fixed: sentence case after the name on both lines. |

## Build review R2 (counts at review: B0 M0 m5)

| Finding | Class | Outcome |
|---|---|---|
| m1 frame time on the ops floor | m | DONE 2026-11-18: three fresh games (8239, 8247, 8260). Measured the `requestAnimationFrame` interval and `loop.delta` (mean and p95 per game); the ops floor reads 1.4 to 1.6 times the checkpoint within each game; operators away vs seated 0.77 to 1.20 times, no consistent change. No reading without the operators exists, so no claim about their cost; physics steps were not recorded. Best game: checkpoint mean 25.4 p95 50.0 ms, ops seated mean 40.7 p95 66.7, both away mean 40.0 p95 66.7. See LIVE_SLICE3.md "R2 m1". |
| m2 PLAN.md out of date | m | Fixed: PLAN.md rewritten in place as a standalone description of the build (D112 to D115 in the preconditions, en-US voice styles, chaseRange 200, seat stand on ops_cooler, sentence-case credits, display-name prefixes, chair moved one cell west). QUESTIONS.md Q1 to Q4 have outcome lines. |
| m3 dialogue sample "awaiting the user's yes" | m | Fixed: DIALOGUE_SAMPLE.md records that the user's 18 Nov 2026 instruction, relayed by the coordinator, signs off the wording once the dialogue review and the build review are clean (conditional; D113 itself was answered on 17 Nov 2026); comma form stands, no cached audio. |
| m4 HANDOVER.md header | m | Fixed: header and Next section describe the build stage on build/ol-m07. |
| m5 Gwen's walk home not re-timed | m | DONE: three natural trips (8239, 8247, 8260). Wall seconds on a loaded machine; against game 8239 only, Gwen home 9.3 s (before 5.5 to 17.25 s), Adaeze 4.3 s (not shorter than before). No Gwen stall in three trips. BUILD_LOG.md has the new table; the old one is marked "before seat stand". Relabelled in R3 (m4). |

## Build review R3 (counts at review: B0 M0 m6)

| Finding | Class | Outcome |
|---|---|---|
| m1 PLAN.md read as a pre-build plan | m | Fixed: PLAN.md rewritten as an as-built, standalone description: placeholders replaced with the built values (Adaeze (4, 5), Gwen (2, 5), `useFrom` dx 0 dy -1, the pool lines and mappings), slice-numbered sentences turned into past statements, the unbuilt capacity-1 queue fallback dropped, no emitter added (`LIVE_SLICE6.md`), the post-hide render recorded as done in the live checks (`LIVE_SLICE3.md`, L6), the 50-seed order check described as a node simulation using the engine's own seeded jitter (`BUILD_LOG.md`). |
| m2 PLAN scenario line numbers out of date | m | Fixed: refreshed to the current scenario.json.erb (the global block, credits, board, cooler, Elena, supervisor, connections and lighting refs); HANDOVER.md:23 and the two refs at HANDOVER.md:57 refreshed too. |
| m3 dialogue sign-off overstated | m | Fixed: PLAN.md section 0 and the R2 m3 row above state the sign-off as conditional, matching `DIALOGUE_SAMPLE.md:3`; D113 keeps its 17 Nov 2026 answer date. |
| m4 R2 trip timings mislabelled and not like for like | m | Fixed: `BUILD_LOG.md` relabelled as wall seconds, notes the load slowed the simulation (use 34 to 36 s against 22 s), compares against game 8239 only, says Adaeze's walk home is not shorter than before, and that Gwen's stalls were not seen in three trips. |
| m5 frame-time conclusion unsupported | m | Fixed: `LIVE_SLICE3.md` "R2 m1" and the R2 m1 row above now state only what was measured (`requestAnimationFrame` interval and `loop.delta`, means and p95 per game; ops floor 1.4 to 1.6 times the checkpoint within each game); no reading without the operators exists, so no claim about their cost; physics steps were not recorded. |
| m6 stale statements | m | Fixed: one "resolved, see ..." line each at `BUILD_LOG.md:3` and `HANDOVER.md` (mount_stuck note, "Not done: m5"). |

## Build review R4 (delta on the cheaper tier, counts at review: B0 M0 m2)

Covers `227a6710e..b6954fc26` and the main merge a43fce0b5 (main 7ca2df60d). R3 m1 to m6 confirmed closed. Merge check: main's phone ink change adds `= menu` stitches only; the operators' `npc_attacked` and `npc_ko` rows are unaffected; recompiled ink equals the committed JSON. Validator 0 errors, 31 warnings; lock/key diff empty.

| Finding | Class | Outcome |
|---|---|---|
| m1 HANDOVER.md:57 `~:1141` wrong line for `server_hall_reached` | m | Fixed: `~:1136` (the `setGlobal` in the `room_entered:server_room` mapping). |
| m2 HANDOVER.md orchestrator state stale after the merge | m | Fixed: records the a43fce0b5 merge, R4 and the next step. |

## Build review R5 (delta, counts at review: B0 M0 m1)

R4 m1 and m2 confirmed closed. Validator 0 errors, 31 warnings; lock/key diff empty.

| Finding | Class | Outcome |
|---|---|---|
| m1 model names in LOG.md and HANDOVER.md | m | Fixed: "cheaper tier". |

Build review closed after R5: no blockers or majors since R1.

## Voicing (18 Nov 2026)

Approval for the 28 new lines relayed by the coordinator (the user delegated m07 office-life voicing). The dialogue review (`DIALOGUE_REVIEW_OL.md`, with its R1 follow-up for "acting up") covers the final text, so it was not rerun.

- `"ttsPregenerateChatter": true` added to scenario.json.erb so the batch lists the cooler pool lines. A dry run before the batch listed exactly the 28 lines as uncached (655 lines in the mission).
- Batch: 28 generated, 28 requests, 0 errors. Durations 1.7 to 4.5 s. No temp files left.
- Spot check by transcription, five clips: words match on all five ("Plan's" heard as "Plan").
- Accent check (the transcriber asked "American or British?" on all 28): Gwen 10 of 14 American; Adaeze 12 of 14 British (non-rhotic, "shedule" for "scheduler", two runs agree on her hub openers). Likely cause: the "light Nigerian inflection" in her en-US style. The transcriber's accent calls are not reliable (it called her "he" twice), so this goes to the user to listen: `tmp/tts_comparison/m07_architects_gambit_new/`. A fix would be a style-wording sample round, then re-voicing her 14 lines, which needs its own yes.
- `tts:wasted`: 2 of 657 clips not requested, both from main (00110584c), old lines with inline stage directions for elena_rodriguez and james_mercer. Not this build's lines; left in place.
- Validator after the flag: 0 errors, 31 warnings with `--skip-ink` (32 with the ink phase, the same as before the flag). Lock and key diff: empty.
