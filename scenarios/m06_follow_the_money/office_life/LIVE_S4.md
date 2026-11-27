# m06 office life: slice 4 live checks (all done; part 3 at the end)

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

## Part 3 (final live checks; server 3096 from build/ol-m06, fresh games 7803 to 7840)

### 5. Handover sheet (A)
- Talk to Irina (in irina_office, needs `--unlock irina_office` in new-game): `tomasz_handover_sheet_shown` false to true and the sheet appears (visible) after the first conversation closes. Seen in 3 fresh games.
- Position: the sheet (16x16, top-left origin) is at (35,-160) and the copier (35x46) at (36,-186), depth -139 against -139.5. It sits on the copier's lower-left corner, half on the front edge, half on the floor, in front of the machine. Screenshot checked: not in a wall, not off the copier, readable, reachable. The guessed (1.1, 7.0) is kept.
- Reading (interact) shows only: "SHIFT HANDOVER / On call tonight: Lerato, Tomasz, Dani, and the app engineer on the end of the phone. / The queue was quiet. / The coffee machine needs descaling. Whoever is in first, please run it." plus "A printout on the copier tray." Interact picks the page up (takeable).
- Second conversation with Irina: no second sheet (one `tomasz_handover_sheet` object, shown stays true). After a reload with the page untaken: sheet not visible, global false again, and a further Irina talk does not print it again. That is PLAN 3.1 and the schema reload rule (an untaken page is gone after a reload, accepted: lore only). After a reload with the page taken: not reprinted either.

### 6. Workstation parity (B)
`trading_workstation` opens the examine popup titled "Trading Workstation" with "Real-time cryptocurrency trading terminal — the transaction volumes on it are absurd for a firm this size"; `blockchain_workstation` opens "Blockchain Analysis Workstation" with "Transaction graph analysis and wallet clustering tools — better forensics than most law enforcement agencies run". Both match main (`git diff main` on the scenario shows no change to either object; the only new `workstation: true` is Tomasz's laptop).

### 7. lerato_phone useFrom (C)
Phone at (254,-277.5); nominal use cell (dx 0, dy 1) is (254,-245.5) on the 8 px world grid, and that exact cell is blocked (it lies on the desk's collision edge). The engine snaps it to the nearest walkable cell (260,-244), one 8 px cell east, which is open: the ASCII grid around it shows open floor to the east and south, and wall or desk only to the west and the far east block. Lerato at (236,-284): `reachable` true, path 7 cells. She used the phone 5 of 5 earlier without a stall. Left as is.

### 8. Pizza (D), servings 2
- Mid floor drop (centre cell (164,-196), player parked at the north-west corner, game 7827): Lerato eats at 3.6 s (servings 2 to 1), Tomasz at 16.8 s (to 0), both return; laptop owner_away true during his trip only. Dani logs `magnet_seen`, takes no job. Priya has no needs state.
- When it runs out: the engine removes the box (`magnet_finished`, `_finishMagnet`, `npc-needs.js:1088`). After the second serving the pizza object was null on the floor, not in the lab, not in the inventory; `interact('pizza')` gives unknown-entity. So the PLAN line "the box stays as decor" was wrong; PLAN 4 L1 corrected. No `grumble_gone` seen: with 2 servings, perPerson 1 and two eaters nobody can arrive at an empty box, so that pool never plays in this setup. Kept as a spare (no clips exist for it).
- Reload with the box on the floor (game 7832, reloaded with 1 serving left, Lerato mid-eat): the box is back on the floor (re-placed about 12 px off, (137,-215) against (149,-204)), `pizza_servings` 1 restored, registered as a magnet again, Lerato resumes `using`, Tomasz then eats (servings 0) and the box is removed. After reload with 0 servings (game 7827): box stays gone, no magnet registered, nobody tempted.
- East door drop stall (not reproduced). Three runs, same lab pick-up route, fresh game each: (1) box at (284,-300) by the east door, player parked far away at the north-west corner (game 7840): Lerato eats, Tomasz eats at 15 s, both home by 29 s; no timeout. (2) box at (292,-300), player standing on the spot (a later game): Lerato away 12 s, Tomasz 17 s, no timeout. (3) box in the doorway gap (308,-300), player at (313,-331) beside it: Lerato away 17 s, Tomasz away 26 s with one replan (his goto re-issued at 18.5 s, about 9 s to reach the box against about 3 s elsewhere), no timeout. A fourth run to drop at (328,-304) failed to pick the pizza up in the lab (driver flake) and tested nothing. Cause of the earlier stall is therefore unproven. Candidates in order: the player body in the doorway lane while Lerato stood at the box (run 3 shows the door lane costs Tomasz a replan, the only slowdown seen); a lingering state of the earlier long-running game. It is a lane and body effect, not a bad reachable cell (the approach cell snaps to open floor in all three runs) and not a scenario defect: no magnet field applies. No engine change made. If it recurs, record the player position and `needs.state` of both NPCs at the stall.
