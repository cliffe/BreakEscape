# Handover: office-life engine fixes (slice 20 + slice 22 follow-ups), 2026-11-07

**Status: IN PROGRESS.**

Two small engine fixes the user approved on 2026-11-07, both follow-ups to the office-life section 12 slices.
They are independent of each other and touch only the engine (no scenario/VM/SecGen content).

## Fix 1: shipped `fadeAmbientTo` now fades ambients in from silence

`public/break_escape/js/systems/sound-manager.js`, `fadeAmbientTo` (the first-play branch, ~line 443).

Phaser `sound.play({ loop: true })` puts back the sound's configured base volume, so the shipped path
started a new ambient at full volume for a frame and only then tweened it down. Slice 20's room-tone side
loop (`fadeLoopTo`, ~line 527) already guarded against this with `sound.play(...); sound.setVolume(0);`.
The old code only zeroed after play when `crossfade` was set, so the shipped (non-crossfade) missions were
left spiking. The fix drops the `if (crossfade)` guard: every ambient is zeroed right after play and the
tween fades it in from 0 to target. `crossfade` is still used elsewhere in the method (the outgoing-loop
handling), so the parameter is not dead.

## Fix 2: `_expectedAwayMs` follows the walked route through doors

`public/break_escape/js/systems/npc-needs.js`:
- New engine-world method `routeLength(from, to, opts)` in `createEngineWorld` (just after `reachable`,
  ~line 3443). It runs the same synchronous pathfinder as `reachable` (`pm.findWorldPath` with
  `worldPathfinder.enableSync/disableSync`), passing the leash `avoidRooms` through, and sums the leg
  distances from `from` through the returned tile-centre waypoints. Returns the straight-line value for a
  same-tile pair, and `null` when the grid is not ready or no path is found.
- `_expectedAwayMs(s)` (~line 1926) now routes each leg via `world.routeLength` (with the NPC's
  `_avoidRooms(s)` leash) instead of a single straight-line `Math.hypot`. Each leg falls back to
  `Math.hypot` if `routeLength` returns null/non-finite; a world with no `routeLength` (the plain test
  stubs) is entirely straight-line, so `GOLDEN_SIMS_DAY` is byte-identical. The use time / queue wait are
  unchanged. Runs once per departure (`npc_left_post`), 2–3 pathfinder calls per departure.

Consumed by `workstation-state.js` `decideLocked` (`lockIfAwayOverSeconds`): a longer, truer estimate for a
cross-room trip can now push an NPC with a screen-lock habit over the lock threshold where the straight-line
lower bound left it under.

## Tests

- New: `test/js/npc-expected-away-route.test.mjs` (5 tests): straight-line baseline with no `routeLength`;
  `routeLength` == hypot gives the same estimate (same-room unchanged-ish); a door route (2x per leg)
  clearly longer; `routeLength` null falls back to straight-line; one unanswerable leg falls back only for
  that leg. All pass.
- No new static `import` in any engine module, so no test-harness copy-list change was needed.
- `bin/test-js`: 411 passed, 1 failed. The one failure is `desk-footprints.test.mjs` (shipped-map
  assertion, unrelated to these files — a pre-existing failure from another session, see
  `HANDOVER_OFFICE_S20.md` Tests). `npc-needs-slots` (holds `GOLDEN_SIMS_DAY`) passes: **GOLDEN_SIMS_DAY
  did not move.**

## GOLDEN_SIMS_DAY

Unchanged, by design. The sims fixture world has no `routeLength`, so every leg takes the straight-line
branch and the day replays byte-identically.

## Live proof — TODO

- Fix 1: sis01 (ward_7 / it_security_office) on :3001 — show the first sampled volume of the new ambient is
  ~0 and rises (before: started at full). Headless makes no sound; prove from the logged/sampled volume.
- Fix 2: `test_needs_sims` slice 22 beat (copier off → Tom walks to the kitchen copier): log the new
  `expectedAwayMs` against the real away time (before: 4482 ms estimate vs 10.25 s real); check Tom's
  screen-lock decision and that the slice 16/22 showcase beats still read right.
- Regressions: `test_needs_leash` passes; `lab_physical_pentest` score 100 (USB 12–13 s, creds 57–65 s).
- Lab log: one line under "Office-life slices" in `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md`
  (the only edit permitted to any lab file).

## Commits

- (pending) engine + test: sound-manager, npc-needs, npc-expected-away-route.test.mjs, this handover.
