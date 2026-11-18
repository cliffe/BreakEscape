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
