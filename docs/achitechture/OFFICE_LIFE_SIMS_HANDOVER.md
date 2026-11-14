# Office life sims showcase: handover

Branch `build/ol-sims`, worktree `.claude/worktrees/p-ol-sims`, merged with main 5edb17541 (format 3).
Ports for this work: 3093-3095 only. No server is left running.

## Where things stand

- **Plan:** `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md`, five review rounds folded in. It
  opens with the audit ("What exists"), then the showcase (seven rooms, 13 NPCs), the slices in
  build order, the README tour, open questions, and "Notes for the missions plan" (three changes the
  m02 pilot plan should take; not applied to that branch).
- **Reviews:** `OFFICE_LIFE_SIMS_BUILD_PLAN_REVIEW_R<n>_DESIGN.md` and `_SERVER.md` in the same folder.

| Round | Design | Server, sync, cheat | Total |
|---|---|---|---|
| 1 | B3 / M11 / m11 | B0 / M1 / m4 | B3 / M12 / m15 |
| 2 | B1 / M8 / m10 | B0 / M1 / m2 | B1 / M9 / m12 |
| 3 | B1 / M11 / m10 | B0 / M1 / m1 | B1 / M12 / m11 |
| 4 | B0 / M2 / m18 | B0 / M0 / m2 | B0 / M2 / m20 |
| 5 | B0 / M5 / m12 (slices 1-5: B0 / M4 / m10) | not run (R4 had no majors) | B0 / M5 / m12 |

Round 5's findings are folded in (6df5b29bb) and have not yet been reviewed. Round 3 grew the
scope, so its counts rose; rounds 4 and 5 found only faults that would break a proof, none that
would break the build.

## Slice SIMS-1 (test_needs_attack, attack and knockout probe): built, live proof incomplete

Commits 782381513, e93a7a70e, d01a0b218, fa140496e. No engine change. Validator clean (0 errors,
4 intended warnings); `test/js/npc-needs-attack-scenario.test.mjs` and the needs test subset pass.
Games are made with `new-game.rb test_needs_sims` and then `swap-scenario-game.rb` onto
`test_needs_attack`, because the folder has no Mission row (db seeding is not allowed).

The second builder ran every beat but hit a usage limit before it could update the README. Raw
probe reports, which nobody has interpreted yet, are in the session scratchpad
`officelife-sims/s1/report-<beat>-<game>.json`: a 4073, b 4075, c 4078, f 4071, g 4079, h 4080,
i 4057 and 4070, i2 4081. First reading, not settled:

- (a) attacked mid-carry, game 4073: turned hostile, job aborted, `blocked`, then `unblocked` and the
  job resumed. This looks like a pass.
- (g) game 4079: `ko_ok false`. The probe did not achieve the knockout, so this is probably the
  probe, not the engine.
- (i2) reload inside the 6 s print delay, game 4081: no page after the reload. That is the result the
  plan expects.
- (e) game 4014: PASS. (d) and (i): the side effects fired. Whether a real interaction ticks the
  `completeTask` on a mapping (npc-manager.js around 1462) is still open; synthetic eventDispatcher
  emits did not tick it.

**Next:** read the reports, rerun any beat that failed for a probe reason, update the README's
live-proof table, engine-faults list and handover, then run two review rounds on the slice with
live proof.

## Next slices (plan order)

SIMS-2 arrival check (the Grace "using lounge_sofa from the office" fault in baseline game 3537;
reproduce it before fixing), SIMS-3 Neil (fixed NPC with a declared mug, auto-print 6 s after a
conversation), SIMS-4 the staff-room pair with coupled breaks, SIMS-5 validator check V10. All
four prove m02 patterns. Then SIMS-6 to SIMS-9 (Leila and Nisha, the pizza, reception and vending,
private office). Schedules, traits, summon, refills and a visitor are in the backlog.

## For the user

- Art and sound requests (from the plan; no images generated): a vending coin sound; visemes for
  Jodie's and Siân's sprites; an optional manager character (a person of colour); a smoking-shelter
  map and props; backlog sprites (street door, desk bell, restock icon). Each has a stand-in.
- Open questions, with defaults, are in the plan's open-questions section (traits and schedules
  kept in the backlog, following the 2026-11-06 picks).
- Engine and server changes (SIMS-2, SIMS-5 and the vending preset data) are AGENTS.md approval
  items.

## Baseline

Game 3537 (before the merge), about 23 fps headless, six needs NPCs active, three tasks ticked in
two minutes. Screenshots `officelife-sims/base-*-3537.png` in the session scratchpad.
