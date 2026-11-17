# Office Life Tour: build report

## S1 (skeleton)

### Built

- `mission.json` (display name "Office Life Tour", no scoring) and `scenario.json.erb`: office and kitchen rooms, objects, the cast with needs, the two globals S1 uses (`office_coffee_off`, `jun_badge_left`), the three aims and eight tasks as structure (nothing ticks them yet), no mission conclusion and no music block.
- Six inks, compiled with no warnings: Ama (start, hub, reopen, exit) and five-line staff inks (start, reopen, one topic with a two-line answer, exit).
- Desk machines in sims order (`chidi_pc`, `jun_pc`, `graham_pc`, `agnieszka_laptop`) so each owner claims the right desk. The office coffee machine has `offWhen "office_coffee_off"`; the kitchen machine is off while the office one is on. The socket lever is in place.
- Validator: 0 errors, 17 warnings, all expected (cross-room need targets, a built-in `cooler` picture-chat note, three recommended-field notes). `test_needs_sims` is untouched, and the engine is unchanged.
- Setup note: a `missions` row for `office_life_showcase` was created in the dev DB, from `mission.json` via rails runner, so that `new-game.rb` could make games. It is a mission row, not a game record, and it resolves once the scenario lands on main.

### Proof

Keyless server on port 3094 (boot log shows the missing-key warning), headless with `setFPS(20)` and fixed steps on, `/tts` aborted. Every game came from `new-game.rb` in its run.

| Check | Result | Figures | Game |
|---|---|---|---|
| Validator | PASS | 0 errors, 17 expected warnings | n/a |
| `atPost` for all five staff | PASS | all at their own post by about 7 s of game clock (Zainab finishes pushing her chair at about 7 s) | 7474, 7485 |
| W0 free cells west of Ama | PASS | 5 free cells (x 112 to 151), or 4 excluding the desk-edge cell; at least 2 required | 7474 |
| First coffee walk | PASS | Chidi: leaves at 50.8 s, uses the machine 53.8 to 65.8 s, back at post 77 s; no overlap, no stall | 7475 |
| W1 | PASS | zero overlap samples for all five NPCs (figures below) | 7475, 7482 |
| W2 | PASS | Jun back at post in 6 s, no wait (figures below) | 7482 |
| Whole-room renders | PASS | both rooms framed in full | 7490 |

Positions (sprite, feet about sprite y + 31): Chidi (228, 98), Jun (89, 137), Graham (92, 99), Agnieszka (44, 143), Zainab (76, 184). Jun's post is `jun_pc`, feet about (92, 164); (3, 6) is only his start tile (96, 192).

### W0, W1, W2

- W0 (game 7474, before any walk): grid cell 8 px. Row y 144, local x: 96 and 104 blocked (desk), 112 to 144 free, 152 to 192 blocked (Ama's body plus padding), 200 free, 208 and 216 blocked (east desk). So 5 free cells west of Ama, and 1 free cell east of her (x 200 to 207).
- W1, east lane (game 7475, office coffee on): Chidi's walk goes down x 204 (body x 193 to 213), 7.3 px from Ama's body on the way out (52.0 s) and 9 px on the way back (70.5 s). About 85 px/s, direct, no overlap, no stall.
- W1, west door (game 7482, kitchen opened first, coffee off at the socket): Chidi's trips at 0:50 and 3:34 run along y 93 above Ama, 10 to 17 px clear. Jun's trip at 3:00: (89, 137), (104, 133), (114, 110), (84, 93), door, minimum gap to Ama 42 px. Graham's cooler trip at 160 s, minimum gap 60 px. Agnieszka's mug run at 20 s and cooler trip at 160 s, minimum gap 39 px. Zero overlap samples for all five.
- W2 (game 7482): Jun's return from the kitchen starts at 200.0 s, (-212, 208), (-4, 53), (66, 75), (103, 109), (92, 133), post (89, 137). `atPost` true at 206.0 s (6 s). Speed 50 to 80 px/s throughout, no wait, minimum gap to Ama 53 px (he arrives from the north-west, never beside her).

Other games: 7476 (lever before the kitchen was opened), 7486, 7487, 7489 (renders, earlier framing).

### Observations

- The kitchen must be loaded before the coffee lever sends anyone west. With the kitchen unloaded (game 7476), Chidi's caffeine job parks `no_source` for the whole 8 minutes and nobody walks to the west door. With the kitchen opened first (entered and left), the same lever sends Chidi and then Jun west. Lever recipe: `moveToNear('office_coffee_socket')`, `interact('office_coffee_socket')`, click `.game-confirm-ok`.
- Chidi pauses about 3.5 s after using the machine before his return starts moving.
- The east lane is open, not closed (see W1). PLAN section 2 and section 11 now say so.
- Only Chidi walks to the office coffee in S1; the queue arrives in S2.

### Screens

`scenarios/office_life_showcase/planning/screens/`: `s1-office-start`, `s1-first-coffee-walk`, `s1-kitchen`, `s1-west-door-walk`, `s1-office-after-kitchen`, `s1-office-posts` (Zainab still pushing her chair), `s1-office-room` and `s1-kitchen-room` (whole-room renders, camera zoom 1, game 7490).

### Scripts

`tools/playtest/showcase-s1-probe.mjs` (phases state, w0, post, homes, watch, lever, render), `showcase-s1-analyse.mjs`, `showcase-s1-path.mjs`.
