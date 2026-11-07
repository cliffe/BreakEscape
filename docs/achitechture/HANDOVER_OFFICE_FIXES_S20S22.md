# Handover: office-life engine fixes (slice 20 + slice 22 follow-ups), 2026-11-07

**Status: DONE (2026-11-07)** — both fixes implemented, unit-tested, live-proven, and the lab and leash
regressions pass (see "Regressions — DONE").

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

## Live proof — DONE

**Fix 1 (sis01_healthcare, game 1030, :3001, headless).** `ward_7` uses the shipped `ambientSound`
(`office_ambient`), the non-crossfade `fadeAmbientTo` path. Headless Chrome's Phaser `sound.volume`
getter does not track `setVolume` reliably, so the robust evidence is a `setVolume` spy over the fade:
on a not-playing ambient, `fadeAmbientTo('office_ambient', 0.5, 800)` applied **first volume = 0**
(silence), then rose toward the target 0.25. Before the fix this branch had no `setVolume(0)` after
`play({loop:true})`, so the first volume applied was the loop's configured base (full ~1.0) — the frame
of spike the fix removes. (Confirmed the server at :3001 serves the edited file.)

**Fix 2 (test_needs_sims, game 1028, :3001, headless).** Kitchen loaded (walked west and back).
`world.routeLength` vs straight line, Tom's desk → copier approach cell:
- Kitchen copier (cross-room, through the door): straight **242 px**, route **503 px** (2.08x round the wall).
- Office copier (same room): straight **91 px**, route **97 px** (unchanged-ish).
Errand estimate on identical geometry (errand, so `useSeconds` = 0): old straight-line
`_expectedAwayMs` = **4765 ms**, new route-following = **11587 ms** (matching the ~10.25 s real isolated
away the slice-22 handover measured on game 973). Live `npc_left_post:tom.expectedAwayMs` on the fired
errand = **10935 ms** (old was 4482 ms on game 973). The real away in this run was 20.4 s because the
showcase's Tom interleaves the errand with his coffee/microwave needs (two `npc_left_post` fired), so it
is not a clean isolated trip; the per-trip geometric estimate is what the fix targets, and it lands on
the clean isolated figure. Tom's own lock is a per-leave coin flip (no `screenHabit.lockIfAwayOverSeconds`
per S22 handover), so his lock decision does not flip on the larger estimate; the slice-16 Amara showcase
(`lockIfAwayOverSeconds` 20) is where a longer kitchen-run estimate reinforces the lock.

## Regressions — DONE

Run on :3001, headless, two sessions at once, using the rebuilt helpers in the session scratchpad
(`leash.py`, `lab.py`, the game 920 command replay `s18a/lab_args920.json`). Logs: `scratchpad/fixes/`.

- **Leash, game 1032: pass.** Leashed Ravi: 0 samples in Maya's office, route ravi_office, west_corridor, store,
  west_corridor, ravi_office. Unleashed: 6 samples in Maya's office. Identical verdict to games 987 and 1000.
- **Lab, game 1033: score 100**, 9/9 tasks (`verify-run.rb --tasks 1033`). Keylogger creds 63 s, USB foothold
  12.5 s, tailgate passed first time (no retry needed). Inside the expected range (USB 12-13 s, creds 57-65 s).
- The lab has no `lockIfAwayOverSeconds` and no `roomTone`, so neither fix could change it; the replay confirms it.
- `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md` now carries the one permitted line under "Office-life slices".
- Node leash tests (`npc-room-leash`, `npc-chase-leash`, `validator-npc-leash`) also pass inside `bin/test-js`.
- Not covered: a listen with real audio for the fade-in (headless audio is inaudible; the spy evidence stands).

## Commits

- `977099989` engine + test: sound-manager, npc-needs, npc-expected-away-route.test.mjs, + first handover draft.
- ff7ab104e handover update with the live-proof numbers.
- Regression results, plan notes and lab log line: the docs commit that marks this file DONE.
