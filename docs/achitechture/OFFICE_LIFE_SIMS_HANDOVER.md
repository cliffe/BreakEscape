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

## Slice SIMS-1 (test_needs_attack, attack and knockout probe): live proof complete

No engine change. Validator clean (0 errors, 4 intended structural warnings);
`test/js/npc-needs-attack-scenario.test.mjs` and `test/js/npc-needs.test.mjs` pass. Games are made
with `swap-scenario-game.rb test_needs_sims test_needs_attack --unlock-all` (no Mission row for the
folder; db seeding is not allowed), a fresh game per KO/reload beat, on a worktree keyless server on
:3093.

**All ten beats proved live** (see `scenarios/test_needs_attack/README.md` live-proof table):
a 4145, b 4144, c 4120, d 4131, e 4126, f 4121, g 4122, h 4123, i 4128, i2 4124. KO drops checked
against the server's `room_states.<room>.objects_added` (b: `ava_folder@kitchen`; c:
`ben_notebook@kitchen`). Tasks ticked by real interactions (real Meeting Note read, Eli's chat opened
and closed in its UI). Screenshots and `report-<beat>-<game>.json` in scratchpad `officelife-sims/s1/`.

- **Scenario fix:** `ava_pc` had `affordance.accepts: ["dirty_mugs"]`, so (being Ava's home object)
  the carry preferred her own desk and she never left the office. Set to `affordance: {}` so the
  kitchen tray is the only accept target, per plan intent.
- **Engine fault (E-carry):** cross-room carry is intermittent — on some seeds Ava's carry fails in
  `goto_item`/`_failJob` (npc-needs.js:3490; `_moveForPhase` 3076-3112, own-post short-circuit 3110)
  and she never leaves her post; on others it runs cleanly (4144, 4145). Behaviours still provable
  with retries. Raise as its own engine slice (the OLMP in-room fallback until fixed).
- **completeTask settled (not an engine fault):** a real interaction ticks it (check_called_home
  4131; check_eli_page 4128). The game-4014 miss was a probe artifact — the synthetic emits ran the
  mapping's synchronous side effects but the probe sampled before the fire-and-forget async
  `completeTask` (npc-manager.js:1462-1472 → objectives-manager.js:655 → server complete_task!
  game.rb:3757; `custom` tasks need no server validation) had resolved.

**Next:** two review rounds on the slice with live proof.

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
