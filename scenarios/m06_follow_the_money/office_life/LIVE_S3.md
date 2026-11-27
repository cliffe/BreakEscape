# m06 office life: slice 3 live checks

Server: keyless, port 3096, worktree p-ol-m06, headless, setFPS(20) with fixed steps. Games 7659 (branch, committed 18e1f16f3), 7664, 7686, 7704, 7710 (branch, ec16c0b90 for 7686 onward) and 7660 (main scenario, same engine) for comparison. Rooms reached with `--unlock security_checkpoint --unlock trading_floor` (test setup, no globals set). Scripts in the build scratchpad `live/`.

## 1 Decor pc twins: PASS
All pc, laptop1 and phone sprites in the loaded trading floor are 15 rows (pc10, pc6 x3, pc8 x2, pc11 x2 [one pc11 is another room's], laptop1, phone1, phone3, coffee, copier, fridge), all visible, alpha 1, positions identical to the main-scenario game 7660. Same rows on a fresh game (7664), a reload of 7659 and a second fresh game. None hidden, none at a random spot. Fallback not needed.

## 2 Coffee queue cells: PASS
Use cells (px): coffee (84,-132), copier (52,-132), fridge (108,-124). Hand-written queue cells snap to (148,-100) and (180,-100): clear of both. The preset cells (-1,-2) kept only one cell at (52,-100), under the copier use cell, which is why they were replaced. Three NPCs wanting coffee at once (game 7710): two use together, the third queues and uses at 16 s, no stall, no job_failed. Fridge (capacity 1): one at a time (7686, two rounds). Copier: not used by anyone yet (no print habit until a later slice); one copier sprite on every load.
Pair at coffee (7686, three breaks): both `using` 2.5 s (first) and 3.4 to 4.0 s (second) after the leave, 3 of 3; `pair_side_swap` logged each time; away about 15.5 to 25 s, no stall.

## 3 Tiled y and spawn: PASS, extras corrected
Dani spawns at sprite (160,-191), home (160,-160): same as main (7660). No tile jump when his home registers; he settles onto the chair at (161,-186) within about 2 s (main leaves him standing). Extras' guessed `position` made them spawn 1.5 to 2 s of walking from their posts (Lerato (240,-271), Tomasz (93,-271)). Corrected to Lerato (7.4, 3.1) and Tomasz (3.1, 4.4), committed ec16c0b90. Home is object-based (Lerato (236,-284), Tomasz (100,-244)); y = tile*32 - 415 for this room. `seated: true` kept (they sit).
Open, cosmetic: Lerato sits in the Tiled chair north of her desk and faces north-east, away from the monitor (the chair is where the map puts it). Move her to a pc with a south chair, or drop `seated`, if the user minds.

## 4 Clock, trips, found-at-post: PASS
- Needs clock vs real: 1.000 (240 s, headless, setFPS(20)). Decay matches config: Tomasz caffeine 8.0/min, Dani 0.2/min.
- Natural rhythm (4 min, game 7659): Dani never leaves (350 min to urgent); Tomasz's first caffeine trip at 176 s (walk 2.1 s, use 12.3 s, home 15.4 s after leaving); Lerato not yet.
- Home dwell cut short by a new urgent need: not measurable in slice 3. Neither extra has a home use (no screen habit yet) and Dani's home is a tile, so nothing long to cut. Re-run when the laptop/desk habit lands.
- Dani at post on first load and on every reload (all loads at (160,-160)). No trip in 30 s before talking. After closing the first talk: leaves 2.1 s later (delayMs 2000), uses coffee at 4.2 s, back at post 20.3 s. After a reload (7686, trader_spoken persisted) the `room_entered` break sends him again 1.7 s after load, back by 16 s.
- Extras reach coffee and fridge: yes (above).
- `floor_staff_ko` (game 7704, Lerato knocked out with the bridge's debugKO, as a punch would; nothing set from the page): global true. Trips already under way (Dani, Tomasz) finish and return home; after that, with caffeine and hunger forced to 5 for 40 s, nobody leaves post: machines off. Dani and Tomasz idle at posts.

## Static checks after ec16c0b90
Validator 0 errors, 44 warnings; lock diff empty; positions diff only added rows (11), none removed.
