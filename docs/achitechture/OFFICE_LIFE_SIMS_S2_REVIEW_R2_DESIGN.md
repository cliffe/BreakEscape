# SIMS-2 review round 2: design and engine view, with live proof

Slice SIMS-2 (OLMP E6, plan 5.2) plus the R1b `offWhen` copy in the needs world's `describe`.
Branch `build/ol-sims-2`, tip `ec3275b8d`. R1 fix commits read: `1b0557fb8`, `c5e2d3c19`,
`4fcda935b`, `9a7363739`, `ec3275b8d`. Keyless server :3094, headless chromium. Scratch
`officelife-sims/s2-review-r2-design/`.

## Verdict: 0 blockers, 0 major, 4 minor (plus 1 nit)

Every R1 finding is fixed in the code, and each fix has a node test that fails when the fix is
taken out (checked by mutation in a scratch copy, below). The phase gate does not let the original
fault back in. The `offWhen` copy is right for every path that reads it, and live it restores the
access beats it was meant to (W6 ran end to end here). My natural real-clock run caught the
original fault twice in natural play, so the guard now has natural evidence too. The minors are
documentation gaps and one visible side effect of the guard that belongs with the existing
navigation owner items.

## R1 findings: fixed?

| R1 finding | State | Where and how checked |
|---|---|---|
| Design M1: chair fetch during `using` hit the guard | Fixed | npc-needs.js:692-693: only `goto_item`, `goto_target`, `queued` and `returning` reach the id/distance check; every other phase returns false silently, as before the slice. Live: in game 4323 Ian's two seating arrivals during `using hot_desk` (a non-own work object, `pathLeft` 4 and 2) were dropped and the use completed (`used hot_desk`, met). |
| Design M2: README over-claimed natural runs | Fixed, with doc gaps (m2, m3) | Grace 16 of 20 (game 4232, `s2/live/grace-real-4232.json`, four early misses) and the 30-run claim dropped. Tom's row now shows a working switch-off. |
| Design m1 / server m2: unreachable home logged twice per cycle | Fixed | npc-needs.js:716 logs once per return; `_watchReturn` passes `keepFarFlag: true` (3908). Live: stub game 4320 and natural game 4321 each show one `arrival_far phase returning` per return, then silent re-plans. |
| Design m2 / server m1: far guard keyed on phase | Fixed | `_farKey = phase:destX,destY` (725-727); reset on unfreeze (1404) and on a queue step (4548). |
| Design m3: test gaps | Fixed | New tests: real besideCell partner, no-id far during `using` (two tests), queue two-cell, freeze reset, stale id while returning, once per return. |
| Design m4: cause of 3537 unproven | Noted in README; now partly answered (m3 below) | |
| Owner item 6: `describe` dropped `offWhen` | Fixed | npc-needs.js:4780. See "offWhen paths". |

## Can the new tests fail?

Scratch copy of the tree at `ec3275b8d` (`git archive`), each fix reverted alone, then
`npc-needs.test.mjs` and `npc-needs-offwhen-adapter.test.mjs` run:

| Mutation | Failing tests |
|---|---|
| A: remove the phase gate | both M1 tests (71, 75) |
| B: far key on phase only | queue two-cell test (76) |
| C: `_watchReturn` without `keepFarFlag` | once-per-return test (79) |
| D: remove the `describe` copy | both adapter tests |
| E: remove the unfreeze reset | freeze test (77) |
| F: remove the queue-step reset | none (nit 1) |
| G: log `arrival_far` on every returning far arrival | once-per-return test (79) |

The eight files with direct `onArrived(` calls plus the two new files pass in the tree (8/8 files).

## The phase gate and the original fault

The fault was an early arrival taken as "arrived" in a phase that can start a use or a pickup.
Those phases are `goto_target` (to `using`, an errand's completion, a phone answer, a visit's
dwell), `queued` (to `qArrived` and the front step) and `goto_item` (to the pickup). All three are
inside the gate, as is `returning` (to `atPost`). Outside it: `using` (nothing starts on an
arrival), `self` jobs (no move), and the wind-up. In the wind-up the job has no `dest` yet, so
`_acceptArrival` returns true, but the wind-up branch (1441-1448) returns before `_advanceJob`, so
the value is dropped and `_leavePost` issues a fresh move. A `_refuseUse` retarget sets
`goto_target` and calls `_leavePost` in the same call, so no tick sees the old `dest` with the new
target. I found no phase where an early arrival can start a use.

## offWhen paths

`describe` now copies object-level `offWhen` (4780), which `getObject` and `listObjects` both use.
Readers of `o.offWhen` through the needs world: `_isOff` (786), the pick paths (1729, 1742, 4513,
`job.offWhen` 2932 and the turn-back 3230), `_pickProducer` (3651), and `_tickKick`'s station
outage kick (2436). Resources keep their own `offWhen` in `npc-work.js` and never went through
`describe`; `npc-reports.js:302` reads the sprite's `scenarioData` directly. The format upgrade
guarantees object level, so no `affordance.offWhen` reader is left. The copy is right for all of
them.

Behaviour changes, checked against each scenario's README or PLAYTEST:

- **test_access_work `ian_pc`.** Live, game 4323: the real socket click set `ian_pc_unplugged`;
  Ian was kicked, parked `off` at `ian_pc` with "This PC is useless." (`npc_need_parked:ian`,
  `reason off`), task "W6: Ian's PC is dead and he parks, at his desk" ticked
  (`w6-parked-4323.png`). On the third park he took the H1 workaround to `hot_desk`, as H1 says.
  After the socket went back on he worked at `ian_pc`, met. That is what PLAYTEST W6 and H1 say.
- **test_access_social `l2_pc`.** Same code path (station `off` park and kick); L2 depends on it.
  Not run live here. `greg_pc` (`f12_pc_unplugged`) carries `offWhen`, but nothing in the
  scenario sets that global, so nothing changes there.
- **test_needs_sims `office_coffee`.** Live, game 4332: the real socket click (confirm dialog,
  "Switch off") set the global, `_isOff` true. Tom made eight caffeine jobs in 480 s: all eight
  picked `kitchen_coffee`, none the office machine; seven reached `using` in the kitchen 1 to 39 px
  from the cell, and one timed out wedged in the office's north-west at (41, 84) with no arrival
  (a navigation wedge, not the guard). This matches the 18a README section.
- **test_needs_sims copiers.** `_pickProducer` reads `offWhen` too, so slice 22's printer power
  was also dead live from format step 8a until this fix. Live probe on game 4332: both on gives
  `office_copier`; office off gives `kitchen_copier` (skipped `office_copier`); both off gives none.
  That matches the slice 22 README text, but it is not recorded anywhere (m2).
- **test_access_networks `bench_pc`.** Satisfies nothing and no NPC has it as `needsHome`, so no
  needs change, as R1b says.

## Findings

### Minor 1: a returning NPC dithers for up to 75 s where its path keeps ending at the office's north-east doorway

npc-needs.js:710-718 (returning branch), 3905-3909 (`_watchReturn`); natural game 4321.

In game 4321 Grace walked home from the sofa and, entering the office near its north-east corner,
got an arrival with `pathLeft 0` 223 px from home at (254, 103). The guard logged it once and
re-issued, which is right. Every re-plan after that ended at the same spot (seven more arrivals
with `pathLeft 0` at (256-279, 85-104), 225 to 253 px off, each followed by `return_resumed`)
until she got home 75 s later (ticks 464 to 767). Game 4332 shows the same at (277, 83) for 18 s.
Before the slice the first of those arrivals would have counted, and she would have "returned to
her post" in the doorway. So this is not a regression in correctness: the guard is now exposing a
path that ends early at that spot. The player sees Grace hovering at the doorway for a minute.

The same spot produced the two goto arrivals in m3 (the fault's own shape), so a path ending short
there is the likely natural cause of 3537 as well.

Suggested fix: record it as an owner item next to item 5 (the Amara-desk wedge), with these
coordinates and game ids; find why a planned path from or through that doorway ends there (a
stitched world path that stops at the room boundary, or a start cell off the office grid). If a
cheap engine mitigation is wanted in SIMS-2: when a far arrival repeats within a few pixels of the
previous far arrival for the same return, start the re-plan from `findNearestWalkableStartCell`
one tile into the room, or log `return_stuck` so the stall is visible in the log, not only as a
string of `return_resumed`.

### Minor 2: the offWhen fix also restores slice 22's printer power, and the docs do not say so

README.md:776, build log SIMS-2 R1b paragraph, OFFICE_LIFE_SIMS_HANDOVER_SIMS2_R1B.md
("copiers (producers, no need)").

The handover lists the test_needs_sims copiers under "no needs change". `_pickProducer`
(npc-needs.js:3651) reads `offWhen` through the same `describe`, so Tom's prints going to the
kitchen copier when the office copier is off, and being blocked with both off, were dead live
from format step 8a until `4fcda935b`. Probe on game 4332 (`copier-4332.json`) shows the slice 22
behaviour back. The README's cross-scenario row also names only `l2_pc` for test_access_social;
`greg_pc` carries an `offWhen` nothing sets.

Suggested fix: add the copiers (slice 22, game 4332 probe) to README row 776 and the build log, say
`greg_pc` has no setter so no change, and add W6 (game 4323) as the live behaviour proof for the
station path (the R1b rows prove only that `_isOff` flips).

### Minor 3: the README still says the fault never repeated in natural play

README.md:762-764 ("The baseline (game 3537) arrival did not repeat in natural play") and the
note on Design m4; build log SIMS-2 section.

Game 4321 (natural, real clock, 480 s): Grace's sofa walk got a `goto_target` arrival with
`pathLeft 0` at (252, 81) in the office, 331 px from the sofa cell (tick 1011), and again at
(196, 105), 371 px off (tick 1819). Both were logged `arrival_far`, re-issued, and she reached the
sofa 5 and 6 px from the cell. Without the guard each would have been `using lounge_sofa` in the
office, which is what 3537 showed. This is the natural reproduction step 1 of plan 5.2 asked for.

Suggested fix: add a row "Natural repeat of the fault, caught" with game 4321, the two arrivals
and `natural-4321.json`, and reword the 3537 note: a path that ends short near the office's
north-east doorway (m1) is now the observed natural cause.

### Minor 4: Tom's 20-trip row describes its method and results loosely

README.md:774; harness `s2-fix-r1b/tom20-kitchen.mjs`.

- "set the scenario's way (global + `global_variable_changed` emit)": the harness writes
  `gameState.globalVariables` and calls `onGlobalChanged` directly, which is not the socket's
  `set_global` path R1 M2 asked for. The outcome holds (game 4332 used the real socket click and
  got the same result), so this is wording only.
- "1 microwave, 2 own-desk": the harness records the first `using` after the forced caffeine,
  whatever its need, so those three are a hunger use and two work uses, not caffeine picks.
  "3 timed out in the sample window" means the harness gave up waiting, not a job `timeout`.

Suggested fix: reword the row (or cite game 4332: eight caffeine jobs through the real socket, all
to the kitchen machine, seven `using` within 39 px, one navigation wedge).

### Nit 1: the queue-step `_farKey` reset is redundant and untested

npc-needs.js:4548. The far key already includes the cell, so a step to a new queue cell can never
match the old key; mutation F (removing the reset) fails no test. Harmless. Keep it as a guard
or drop it; either way say in the comment that the key change already covers it.

## What holds (no finding)

- **Stubbed short path, game 4320.** Grace's path truncated to 35 %: `arrival pathLeft 0` 463 px
  off at (81, 179) in the office, `arrival_far goto_target`, re-issue; the re-issued walk stalled
  and the job failed `timeout` at (104, 179). No `using` away from the cell. On the way home, one
  `arrival_far phase returning` (the stub truncates that path too), then silent
  `return_resumed`, confirming m1. Screenshots `stub-first-far-4320.png` (Grace's overlay
  "goto_target lounge_sofa" over the west desks) and `stub-after-fail-4320.png` ("returning").
- **Natural real-clock run, game 4321, 480 s.** 28 `using` entries for six NPCs: every one within
  12 px of its move's cell, every non-own use within 8 px of the target's approach cell measured
  independently, and every one in the object's own room. Four `arrival_far` (two goto, caught as
  in m3; two returning), zero `arrival_ignored`, one `job_failed timeout` (Grace wedged at
  (227, 134), owner item 5), no page errors. Screenshot `natural-t90-4321.png` (Grace using the
  sofa in the lounge).
- **Tom with the coffee off, game 4332.** As above; zero `arrival_ignored`, one returning
  `arrival_far` (Grace at the doorway, m1), 30 `using` entries, all in the object's room, maximum
  39 px from the cell. `tomoff-t90-4332.png` shows Amara's "no entry" coffee icon for the off
  machine.
- **Sync.** The R1 and R1b commits add no synced or persisted state.

## Live runs (this review)

| Game | Run | Result | Evidence |
|---|---|---|---|
| 4320 | Stubbed short path on Grace, manual clock | far, re-issue, `timeout`; no use off the cell; one returning far log | `stub-4320.json`, `stub-first-far-4320.png`, `stub-after-fail-4320.png` |
| 4321 | test_needs_sims natural, real clock, 480 s | 28 `using`, max 12 px; two natural goto far arrivals caught (m3); doorway dither 75 s (m1) | `natural-4321.json`, `natural-t90-4321.png`, `natural-end-4321.png` |
| 4322 | Tom coffee off (first try) | probe failure: title screen still up when rooms were entered, kitchen never loaded; discarded | `tomoff-4322.json` |
| 4332 | Tom coffee off through the real socket, real clock, 480 s; copier probe | 8/8 caffeine jobs to the kitchen, 7 used within 39 px, 1 nav wedge; copier pick follows `offWhen` | `tomoff-4332.json`, `tomoff-t90-4332.png`, `copier-4332.json` |
| 4323 | test_access_work W6/H1, real socket | parked `off`, "This PC is useless.", W6 ticked, H1 workaround, back to `ian_pc` when on | `w6-4323.json`, `w6-parked-4323.png` |
