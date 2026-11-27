# Handover: office life slice 23, magnet on a table (2026-11-07)

**Status: DONE (2026-11-07).** Plan: `OFFICE_LIFE_PLAN.md` 12.13 (the design and the Built line, which lists the choices made
without asking). The user's yes (2026-11-07) to "Should a cake dropped beside a table snap onto the table?".

## Done (commits on main; `git log --oneline --grep "lice 23"` after a rebase)

- dce9f463c plan 12.13 (written and committed before any code).
- 2d6295ef5 engine and tests: `systems/table-drop.js` (new, no imports: `snapToTable`, `tableUnder`, `edgeCell`,
  `savedPosition`, `placedDepth`, `reloadedPlacement`); `item-drop.js` imports it (no test harness copies `item-drop.js`, and
  game.js loads it dynamically), snaps magnets only, saves every drop's top-left, exposes `window.tableDrop`; `npc-needs.js`
  `approachCell` asks `window.tableDrop.approach` for a magnet (no static import added). `test/js/table-drop.test.mjs`.
- 11044a15f `validator-office-presets.test.mjs` listed slice 22's `kitchen_copier` (stale since slice 22).
- ff5fd7a41 fix (game 978): only a table with an edge cell is snapped to; no "behind" edge.
- fdbc431a1 fix (game 980): `settleOnTable` re-raises a magnet on a table when the needs system registers it (`_addMagnet` calls
  the optional `world.settleMagnet`), because the server's `item_add_params` keeps only `position.x` and `.y`.
- 6cfc8e18e fix (game 981): a settled magnet takes the centre origin again, so it is in reach from in front of the table.
- This commit: plan Built line, sims README "Slice 23", session row, lab log line, this file.

Tests: `table-drop` 10 (snap in range, none beyond, nearest and tie, slide past an object and a full table skipped, unusable
table skipped, determinism, persistence round trip, edge cell, room helpers, reload re-raise). `GOLDEN_SIMS_DAY` unchanged.
`bin/test-js`: 409 of 410 files pass; the failure is `desk-footprints.test.mjs` ("no shipped room map opts in except the desk
seating test room"), from seat box slice 7 (594226d2c opted `room_lw_accounts` in), not this slice.

## Live proof (:3001, headless; evidence in the session scratchpad `s23/`)

See the sims README "Slice 23" table: games 979 (drop on the table, Sanjay eats at its front), 982 (reload keeps it on the table,
pickup by a real pointer click, open-floor drop and its reload), 985 (three eaters along the front edge, staged with 3
servings). Scripts: `s23/k.py`, `all.py`, `three.py`, `r.py`, helpers `s23/lib.py`.

## Regressions

- Leash game 987: pass (leashed 0 samples on Maya's floor in 29 s; unleashed 6 in 22 s).
- Lab game 989: score 100, 9/9 tasks; creds 65 s, USB foothold 13 s. Game 988: score 40, 7/9 (the replay's `enter secure_area`
  behind Len failed, so `tailgate_in` and `closing_debrief` did not complete); creds 65 s, USB 13 s. Both ran after seat box
  slice 7 (b5d8897d2) moved the accounts PCs onto the desk tops, `usb_target_pc` among them, which is the likely cause of the
  USB time (9.5 to 11.5 s before). Slice 23 does not reach the lab: it has no magnet, and a non-magnet drop moves by at most
  half a pixel.

## Left

Nothing for this slice. For later:

1. **Game 983 was touched by mistake.** I took `GAME_ID` from the wrong `new-game.rb` run and opened a headless session on game
   983 (`lab_physical_pentest`, created 01:59 by another session, probably seat box slice 7's live proof): `bootstrap` closed
   its title screen, and the rest (enter, drop) failed on its tutorial modal. Session stopped at once. Whoever owns 983 should
   check it or use a fresh game.
2. **USB foothold 13 s** in the lab after seat box slice 7: worth a look by that session (Sofia's walk to the moved
   `usb_target_pc`), and game 988's failed tailgate replay.
3. `table_surfaces.json` has no `front` per texture yet (TABLE_SURFACE_PLAN); `baseY` reads it when it arrives. Until then the
   base row is 40% of the sprite height.
4. Reach on a shallow desk: reach is measured to `sprite.y`; a 27 px item on a desk1 (16-row top) is reachable from in front
   only because the settled sprite keeps the centre origin. Not changed in `interactions.js`.
5. The server could keep `position.elevation` (`item_add_params` permits only x and y); not needed now, so not asked for.
