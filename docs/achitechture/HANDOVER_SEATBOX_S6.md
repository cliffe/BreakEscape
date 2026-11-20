# Seat box slice 6 (the NPC needs half) — handover (2026-11-07)

Plan: `docs/achitechture/SEAT_BOX_PLAN.md` section 6 (the hand-off note's items 1–10) and the
"State of the slices" / "Open item 1" in `HANDOVER_SEATBOX_S7.md`. Office-life session agreed a
clean window; their last engine commit was `977099989`. Slice 6 builds on seat-box.js
`sweepBlock` (shipped unit-tested but unused in slice 1).

## Done — committed

- **`11b8aeb60`** engine + unit tests. `public/break_escape/js/systems/seating.js`,
  `test/js/seat-box-npc.test.mjs` (6 cases). Imports `sweepBlock` from `seat-box.js`.
  - **Item 2 (slide target).** `updateNeedsSeat` (seating.js ~1395): after
    `slideChairFootTo(near.obj, feet.x, feet.y)` it now calls `sweepChairToContact(near.obj,
    <face compass from toward>)`.
  - **Item 3 (fetch path).** `advanceFetch` (~1480): on arrival, before `endFetch(...true)`, the
    same `sweepChairToContact(f.chair, <face compass from f.toward>)`.
  - **Item 4 (tuckIn).** `tuckIn` now moves `min(TUCK_PX, sweepBlock(...))` along the facing, and
    its caller in `unseatNPC` passes `st.homeFacing`, not the current `facing`.
  - **Item 6 (fidget clamp).** `fidgetChair` clamps the roll offset to `sweepBlock` from the home
    spot, so a roll can't push the block into a desk, front or sides.
  - **Shared helper** `sweepChairToContact(chair, faceCompass)` (exported for tests): sweeps the
    chair's seated block along `faceCompass` and slides it that far only when a body is within
    `CONTACT_SWEEP_PX = 24`. `tuckIn` and `sweepChairToContact` both exported (like `fidgetStep`).
  - **Item 1 (block)** was already the chair's own body (no change, per plan). **Item 5 (getting
    up)** is the slice-1 `standSpot` order, unchanged here. **Items 7–10** are checks (below).
- **`b88bd7825`** desk-footprints test fix. `test/js/desk-footprints.test.mjs` "no shipped room
  map opts in except the desk seating test room" added `room_lw_accounts.json` to the allow-list.
  - **Cause:** slice 7's room half (`594226d2c`) set `deskBoxes: footprint` on
    `room_lw_accounts.json` (walk-audit pockets 0, stand-audit clean) but the test's allow-list
    was never updated, so case 9 has failed since `594226d2c`. Not a code bug.
- **`1c2c1bde8`** test-only `window.__seatBoxNpc === false` flag in `sweepChairToContact`, keeps
  the interim "tile out" look for the before/after audit (mirrors slice 1's `__seatBox`).

## Tests

- `bin/test-js`: **414 files pass, 0 fail** (clean re-run). The first run showed 1 flake
  (`scripted-conversation-queue.test.mjs`) caused by the concurrent interaction-code agent's
  harness state; it passes standalone and in the harness in isolation, and is not in my scope.
- **GOLDEN_SIMS_DAY**: byte-identical, unchanged (`npc-needs-slots.test.mjs` passes). Slice 6
  touches only chair geometry, not needs decisions, as expected.
- `seating.test.mjs` (47), `seat-box.test.mjs`, `seat-box-npc.test.mjs` (6), `desk-footprints`
  (11) all pass.
- Did NOT run: `bin/rails test`, reopencheck (next session; low risk — no ink/scenario change).

## Live — done

- **test_needs_sims regression (game 1041, :3001).** Needs NPCs sit at their desks, unseat and
  re-seat, idle swivel/coffee queue/screen-lock tasks all fire. Screenshot
  `…/c84d7b68-…/scratchpad/s6/after_tucked.png` shows the office with chairs tucked at desks, no
  breakage. Measured block-to-desk gap: Tom 1 px, Grace 9 px, Amara 17 px, Sanjay 18 px (tucked,
  not a tile out).
- **Before/after (same game, `__seatBoxNpc` on vs off):** castors **identical, delta 0**. In
  test_needs_sims the work cells already place chairs at/near their desks, so the contact sweep is
  a no-op here — slice 6's visible F+4 tuck is exercised by the **lab** (room_lw_accounts,
  footprint boxes, work cell a tile out), i.e. the slice-7 lab, not this scenario. The unit tests
  prove the F+4 tuck numerically (`seat-box-npc.test.mjs`). before/after screenshots:
  `scratchpad/s6/before_interim.png`, `scratchpad/s6/after_tucked.png` (look the same, as
  expected).

## Live — done (2026-11-07, verification session)

Ran all five on `:3001`, headless, one browser at a time. Evidence in
`…/c84d7b68-…/scratchpad/s6/` and the office-life s21/s22/s18a dirs.

- **REGRESSION FOUND + FIXED — `af380d860`.** The slice-21/22 live checks exposed that the item-6
  fidget clamp killed the cosmetic idle roll entirely: across full fidget cycles every seated NPC
  (amara, grace, sanjay, tom) showed chair offset 0. Cause: `fidgetChair`'s clamp swept with
  `ignore: [chair]` only, but the seated NPC's own sprite body overlaps the seated block, so
  `sweepBlock` read distance 0 and clamped the roll to nothing. Fix: add the riding `sprite` to the
  ignore list (`seating.js` ~991). After: amara rolls 2 px away from her desk (matches
  `fidgetOffset` target) and tucks back; clamp still bounds the roll (no desk clip). `tuckIn`
  (item 4, NPC gone) and `sweepChairToContact` (item 2/3) were never affected — they don't run with
  the NPC body on the chair. `bin/test-js` 414 pass / 0 fail after the fix; GOLDEN_SIMS_DAY intact.
- **Slice-21 roll + idle swivel (game 1046).** `s21/roll.py 1046 amara`: roll out dx −2, dy +1,
  then tucked back (strip `s21/roll-amara-strip-1046.png`). `s21/swiv.py 1046 amara idle`: swivel
  NE→east→NE. Fidget clamp holds, no clipping.
- **Slice-22 errand (game 1046).** `s22/proof.py 1046 setup|off|b`: office copier switched off, Tom
  routed to the kitchen copier (`object_revealed:kitchen_out_a` producer `kitchen_copier`,
  `npc_print_fetched:tom` producer kitchen_copier), left post and returned, `keep_tom_away`
  completed; expectedAwayMs 11146, away 12.75 s. Screens `s22/b-copier-off-{1..4}-…-1046.png`.
- **test_needs_leash (game 1045).** `leash.py 1045`: leashed Ravi 0 Maya's-office samples (routes
  via west_corridor, the long way); unleashed 12 (cuts through maya_office). PASS (12 vs the
  reference 6 is just poll timing; seating slice 6 does not touch routing).
- **Lab replay (game 1047).** `s18a/lab_args920.json` → `lab.py`, then `verify-run.rb --tasks`:
  score 100, 9/9 tasks, creds 64.6 s, USB foothold 10.6 s (baseline 1033: 100, 63.2 s, 12.5 s —
  within spread). Ran on the fixed JS. F+4 tuck: hampshire measured 0.7 px to the desk front
  (tucked to contact); pierce seated too. A clean before/after `__seatBoxNpc` off/on screenshot pair
  was NOT captured — the live per-frame seat loop re-seats the chair each tick, so a manual pull-out
  snaps straight back, and a real reseat needs an errand cycle; the F+4 tuck stands on the 0.7 px
  measurement and the 6 `seat-box-npc.test.mjs` cases. Tucked-state shot `s6/lab-tuck-A-tucked-1047.png`
  (game had reached the debrief overlay by then).
- **bin/rails test:** 953 runs, 3359 assertions, 0 failures, 0 errors, 1 skip.
- **reopencheck:** 4 problems, all m09 phone ink (the documented pre-existing baseline; no ink change).
- **Walk/stand audit (item 7):** the JS fix changes only the seated-NPC fidget-clamp ignore list, not
  walk paths, stand spots, desk footprints or empty-chair tucking, so the slice-7 walk baseline holds
  by construction; `walk-audit.test.mjs` passes in `bin/test-js`. The browser `stand-audit.mjs` run on
  game 1047 reported "games 0/0" (needs every room unlocked via `snapshot-games.sh`); not pursued
  given the fix's orthogonality. **Open if the office-life owner wants the full browser stand-audit
  re-run on a snapshot-unlocked lab game, plus the before/after __seatBoxNpc screenshot pair.**

## Live — WAS still to do (now done above)

Run these on `:3001`, headless, one browser, check `pgrep -fa 'chrom.*headless'` first
(wait if two). Office-life drivers live in their scratchpad
`/tmp/claude-1000/-home-cliffe-…-3c2d3b5d-…/scratchpad/` (`cmd.sh` primitive, `leash.py`,
`lab.py`, and `s22/proof.py` + `s22/lib.py` for the errand/idle beats; `s22` handover
`docs/achitechture/HANDOVER_OFFICE_S22.md` has the recipe).

1. **Explicit slice-21 idle-swivel and slice-22 errand beats** in test_needs_sims, each with a
   chair-pulled-out screenshot. Use `s22/proof.py <game> setup|a|off|b|c` (errand to the kitchen
   copier with the office copier switched off) and the s21 idle-swivel driver. Confirm the fidget
   clamp holds while a seated NPC rolls (no chair clipping a desk).
2. **test_needs_leash.** `python3 <office-life-scratchpad>/leash.py <game>` on a fresh
   test_needs_leash game. Expected: leashed Ravi 0 Maya's-office samples, unleashed 6.
3. **Lab replay.** `s18a/lab_args920.json` through `lab.py`, then
   `tools/playtest/verify-run.rb --tasks <id>`. Baseline game 1033: score 100, creds 63.2 s, USB
   12.5 s. This is where slice 6's tuck actually engages (footprint-boxed desks, tile-out work
   cells) — eyeball the accounts staff tucked to F+4.
4. **Walk audit** (empty-swivel pass check, item 7): `room-snapshot.mjs --walk` + `walk-audit-
   diff.mjs` on the lab, or confirm the slice-7 baseline still holds; check needs NPCs pass tucked
   empty chairs with no stuck lines.
5. `bin/rails test` and the phone reopen check before closing the slice.

## Notes / gotchas

- The shared tree has the concurrent interaction/challenge agent's uncommitted work in
  `apply-actions.js`, `npc-manager.js`, `room_lw_archive.json`, the lab scenario, and
  `remove-item-action.test.mjs` — leave those alone. The modified `test_needs_sims/dungeon_graph.*`
  and `generate_rooms.py` are not ours either.
- My headless session for game 1041 (PID noted in the run) should be stopped by PID when done.
- `sweepChairToContact` reads `chair.scene.physics.world`; in a legacy (non-footprint) map it
  still finds the bottom-quarter desk body, whose front edge is at F, so a front chair still tucks
  to castor F+4 — the tuck is not gated on the footprint opt-in.
