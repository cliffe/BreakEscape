# m06 office life: slice 4 live checks (partly done)

Server: keyless, port 3096, from build/ol-m06 (commit 8d59ba7cb for the threshold; trips measured on fe9a73feb values, same trip geometry). Games made with new-game.rb and `--unlock security_checkpoint --unlock trading_floor --unlock blockchain_lab`. Scripts are in the build scratchpad `live/` (t1.mjs trips, t2.mjs phone, pz.mjs pizza with `DROP=centre`, h1.mjs handover sheet and workstation, written, NOT run).

## 1. Trip table (Tomasz), laptop never locked in any trip

| Trip | expectedAwayMs | real away | tries | laptop |
|---|---|---|---|---|
| coffee | 14.5 s | 14.7 s | 5 of 5 (earlier run) | open |
| hunger, fridge | 17.47 s (17472 to 17476) | 17.5 to 17.8 s | 5 of 5 | open |
| phone answer (Lerato away) | 14.4, 15.0, 15.3, 15.6, 15.6 s | 22.5, 23.7, 23.8, 23.7, 25.8 s | 5 of 5 | open |
| pizza (box dropped mid floor) | 13.4 s (Tomasz), 14.9 s (Lerato) | 16.5 s (Tomasz) | 1 each | open |
| pizza (box dropped by the east door) | 14.6, 14.6 s (Tomasz), 15.9 s (Lerato) | see 4 | 3 | open |

Threshold: `lockIfAwayOverSeconds` 22 (was 30 placeholder). Longest expected 17.5 s (fridge), so margin 4.5 s; every lever stays open, a lock would need a trip far longer than any now possible. `lockChance` 0.2 unchanged. The phone answer real time exceeds expected by 8 to 10 s (call length), harmless because the decision is taken at the leave. Pizza was only run twice (two servings per game): pizza expected has 5 samples, real has 1.

## 2. Home-dwell cut short
Not applicable for m06: Tomasz has no home use (needsHome is his laptop, which has no use job), so no long home use exists to cut short. Not run elsewhere.

## 3. Phone lever (spare phone rings lerato_phone)
- Lerato at post: 5 of 5 she answers (call starts about 2.5 s after the interact, lasts about 12 s), Tomasz stays at post, laptop owner_away stays false. First two tries of the first run were invalid (the previous call was still running; ring ignored while a call is live); the script now waits for no call.
- Lerato away on coffee: 5 of 5 ring 1 at about 0.3 s, ring 2 at about 3.5 s, Tomasz claims from ring 2, crosses, picks up about 4 s later, `workstation_owner_left` fires, `tomasz_laptop_owner_away` true for 23 to 27 s, back to false on return; lock stays false.

## 4. Pizza (take from lab, carry, drop on floor)
- Player route: the pizza is reachable only by moving round the conference table (waypoints (340,-250) (330,-150) (380,-110) (400,-125)); plain `interact`/`moveToNear` from the lab door stops at the table, a test-driver issue, the path exists.
- Dropped mid floor: Lerato walks over at once (seen), eats (servings 3 to 2), Tomasz follows about 15 s later (servings to 1); laptop owner_away true during his trip, back false. Dani logs `magnet_seen` but takes no job; Priya has no needs state. Both extras only take one serving each.
- Finding and change: with `servings: 3`, `perPerson: 1` and two eligible NPCs the box can never run out (ends at 1), so `grumble_gone` never plays. Changed to `servings: 2` and `pizza_servings: 2` (commit 8d59ba7cb, PLAN.md edited to match). The count-to-0 run and the `grumble_gone` line are NOT yet seen.
- Dropped by the east door (player standing at the pizza): Lerato ate; Tomasz's trip hit `job_failed timeout` twice and Lerato's return stalled for about 100 s. Looks like a doorway/lane block caused by the drop spot plus the player; not reproduced mid floor. Worth one more look (drop at door with the player parked clear).
- Reload with the box on the floor: NOT run.

## 5. Handover sheet, 6. lerato_phone useFrom, 7. workstation parity
NOT run (script h1.mjs written for 5 and 7). 6: indirectly confirmed, Lerato answered at post 5 of 5 and used her desk phone without a stall, but position not inspected against walls.
