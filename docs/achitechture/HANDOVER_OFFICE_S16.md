# Handover: office life slice 16, lock-screen habits and cues (2026-11-06)

**Status: IN PROGRESS. Engine, validator, schema, tests and showcase are committed and green; most of
the live proof is done. Left: two live checks, the two regressions and the docs (see "Left").**
Plan: `OFFICE_LIFE_PLAN.md` 12.2 (spec), 12.8 row 2, 12.9 OQ27-29 and OQ47, 13f. The art
(`npc-lock.png`, `npc-lock-open.png`) and the two run-time chimes were approved by the user on
2026-11-06, so the chimes play (no `unapproved` logging) and the glyph uses the icons.

## Done (commits on main; `git log --oneline --grep "lice 16"` after a rebase)

- aebba3ab5 engine, validator, schema, tests:
  - `workstation-state.js`: `habitOf`, `decideLocked(data, ownerId, leaves, roll, habit, expectedAwayMs)`
    (object `lockChance`/`locksScreenOnLeave` win; then the habit: a trip estimated at or under
    `lockIfAwayOverSeconds` stays open, a longer one or a null estimate rolls `lockChance` with salt
    `habit:<objectId>:<leaves>`, implied 1 when only the threshold is set; no habit: locks);
    `install` passes the whole `npc_left_post` payload; `autoLockMs`; an idle map started at the
    leave, restarted on `workstation_accessed` and while a minigame is open on the object;
    `tick(nowMs)` locks an open station once (`how: "auto"`); `workstation_screen_changed:<id>`
    `{ objectId, ownerId, locked, how }` on every change (`leave`, `auto`, `return`, and `late`
    for a station first decided in `onInteract`, which keeps its old globals behaviour: no
    `_publish` there, so the lab's late path is unchanged). Env gains `clock()` and `inMinigame()`.
  - `npc-needs.js`: `tick()` ends with `this.world.afterTick?.(clockMs)`; the live adapter calls
    `window.workstationState.tick`. Stubs have no `afterTick`, so the decision log is unchanged.
  - `lighting.js`: `FLASH_KINDS`, `flashShape` (pure), `flash(objectId, kind, ms)` and
    `drawFlashes` (side map keyed by object id, drawn in each room's pass after its emitters, at the
    indicator record's point, above the light map with a hue-keep stamp in a lit room; clock starts
    on first draw; destroyed on expiry). Lock: blue 18 to 10 px over 500 ms; unlock: warm white 16 px
    fading over 500 ms; reduced motion: one 300 ms step at the end size. No new static import.
  - `npc-office-visuals.js`: `lockCuesOn`, `lockCuePlan`, `ownRoomHearing`, `glyphLeft`,
    `glyphSequence`, `LOCK_GLYPHS`; `playAt(..., opts)` with `ownRoomOnly`, `channel` (a limiter per
    channel; `this.limiter` is still the `use` channel), `scale`, `synth`; `onScreenChanged`
    (flash with lighting, else the glyph; chime for leave and return only, `CHIME_SCALE` 0.5 of a use
    sound; `workstation_lock_heard:<id>` when heard; `cueLog`); `showGlyph` (dark backing, open then
    closed on a lock and closed then open on a return, swap at 300 ms, gone at 1 s; image left edges
    -7 and -15 so the 15 px padlock bodies coincide); `preloadGlyphs`; `playChime` (two sine notes,
    880 to 587 Hz falling for a lock, rising for an unlock, through `scene.sound.destination`).
    Installs while `officeVisuals` or `lockCues` is on; each layer checks its own switch.
  - Validator `check_lock_habits` (`validate_npc_needs.rb`): `lockCues` boolean; `screenHabit`
    shape, bounds and unknown keys; habit with no station (warning); habit shadowed by object lock
    fields (warning); `autoLockSeconds` > 0 (error), on a non-workstation (warning), on a station
    that always locks (warning). Known fields in `validate_scenario.rb`; schema entries.
  - Tests: `workstation-state` 20, `lighting-workstation-indicators` 13, `npc-office-visuals` 33.
- a3cd35e6d showcase (`test_needs_sims`): Amara `screenHabit.lockIfAwayOverSeconds: 20`; Sanjay
  `screenHabit.lockChance: 0`; `sanjay_pc.autoLockSeconds`; Tom unchanged; tasks
  `hear_screen_lock`, `see_auto_lock`, `use_open_screen` with mappings on Amara's list.
- f84c777de fix from the live proof: the hold also matches the examine view's string `itemId`
  (`minigameOnObject`); before it, the auto-lock fired with the examine view open (game 904).
- ea3ec20a2 showcase `sanjay_pc.autoLockSeconds` 30 to 20 (his trips take 19 to 27 s).
- `bin/test-js`: 402 files pass (after aebba3ab5). `bin/rails test`: 953 runs, 0 failures, 1 skip.
  Validator on the sims: no new warnings (27 before and after).

## Live proof so far (:3001, headless; evidence in the session scratchpad `s16/`)

- **Game 904 (lighting on).** Amara's office coffee: `expectedAwayMs` 15696, 15367, 15368 (open,
  white dot). Kitchen run with the office machine taken: 21819 (locked, chime heard 0.104). Strip
  `s16/strip-lit-amara-904.png` (white dot; lock flash at +180 ms; steady blue dot; wake flash at
  +150 ms; no dot), full frames `a1-whitedot-904.png`, `a-amara_pc-*-904.png`. Auto-lock on
  Sanjay's PC 20 s after the leave: `strip-lit-sanjay-auto-904.png`, `s-sanjay_pc-auto-*-904.png`.
  Chime log `playlog-904-a.json`: every lock and unlock in the office played on channel `chime`,
  hearing 1, volumes 0.077 to 0.104; the auto-lock has no entry. Tom's object roll still decides
  (locked on one leave, open on others).
- **Game 906 (lighting off, `localStorage.breakEscapeLighting = 'off'`).** Amara queued at the
  office coffee: 27696 (locked; `hear_screen_lock` completed). Strip
  `s16/strip-nolight-amara-906.png` (open then closed padlock on the lock, closed then open on the
  return, bodies aligned), full frames `g-amara_pc-*-906.png`. Sanjay's auto-lock at 161750, 20 s
  after the leave at 141750: glyph shown, no chime (`cueLog`). Glyph map empty afterwards.

## Left (exact next steps)

1. **Two live checks** on a fresh `test_needs_sims` game (the drivers are in `s16/`: `d.py`,
   `probe.js`, `probe2.js` (one-step freeze: `__s16.freezes.push({objectId, how, delay})`),
   `probe3.js` (two-step: `__s16.steps.push({objectId, how, at:[ms, ms]})`), `multi.py <game> <s>
   <prefix>` shoots and wakes, `watch.py`, `strip.py`):
   - **Hold under the examine view** (needs f84c777de loaded): stand at Sanjay's desk (`moveTo`
     123,150), send him off with `__test.needs.set('sanjay','social',5)` (his needs are work,
     hunger, social, caffeine; thirst does nothing), wait ~3 s, `interact sanjay_pc`, then poll for
     30 s: `workstationState.idle` should keep moving forward and no `auto` event; close it
     (`MinigameFramework.endMinigame()`) and the lock should follow 20 s later.
     `use_open_screen` should complete. Close any person-chat first: a stray click on Sanjay opens
     one and blocks `interact`.
   - **Kitchen doorway**: open the kitchen door, stand inside the kitchen (player room `kitchen`),
     send Tom then Amara for coffee (`set tom caffeine 10`, 3 s, `set amara caffeine 10`); the
     `screen_lock` entry for `amara_pc` must show `hearing 0`, `volume 0`, no
     `workstation_lock_heard`. Office entries are already in `playlog-904-a.json`.
2. **Regressions**: `scratchpad/leash.py <game>` on a new `test_needs_leash` game; the lab by
   replaying `scratchpad/s21/lab_cmds.json` (without `quit`) through `scratchpad/lab.py` on a new
   `lab_physical_pentest` game, then `tools/playtest/verify-run.rb` (score 100). Check the lab's
   lock behaviour against game 900: Chris's `staff_pc` locks on every leave (object field),
   Melanie's `staff_pc_2` never locks; neither has `autoLockSeconds` or a habit, so decisions must
   be identical. What changes there is only the cue: Chris's leave now plays the lock flash and
   chime, his return the wake flash (12.10). **If the lock decisions differ, stop and report; do
   not land docs.** OQ27 says the lab session agrees before the slice lands, so the report must say
   the lab now gets the cue by default and can set `"lockCues": false`.
3. **Docs**: plan 12.2 Built line (commits, games, the choices below); sims README live-proof table
   rows (games 904, 906 and the new one); the lab's "Office-life slices" log line (that line only);
   a slice 16 row in `OFFICE_LIFE_HANDOVER_SESSION.md`; this file marked DONE.

## Choices made without asking (for the Built line)

1. `lockIfAwayOverSeconds` compares `expectedAwayMs <= threshold` as short (exactly the threshold
   stays open). Amara's 20 s threshold splits as the plan hoped: office coffee 15.4-15.7 s open,
   kitchen 21.8 s and a queue place 27.7 s locked. Not moved.
2. `sanjay_pc.autoLockSeconds` 20, not the plan's 30 (live trips 19-27 s).
3. A late decision (`how: "late"`) fires the event only when it locks, and does not republish the
   globals (unchanged behaviour); an auto-lock already due at discovery counts for a late station.
4. While a minigame is open on the object the idle clock restarts every tick (activity), rather
   than pausing; the screen locks `autoLockSeconds` after the minigame closes.
5. The glyph shows the first state for 300 ms, then the end state until 1 s (lock: open then
   closed; return: closed then open), on the action icons' dark backing, 2 px above the object's
   top centre, depth 5000. Text stand-ins `L`/`U` until the icons load; both icons are preloaded on
   install when there is no lighting system.
6. Chimes: two 0.22 s sine notes 110 ms apart (A5 and D5), at half a use sound's level
   (`CHIME_SCALE` 0.5), with the use sounds' eight-tile fall-off, own room only, channel `chime`.
7. The flash is drawn in the room's pass (so it is hidden with its room off screen) at depth
   `LIGHT_DEPTH + 2`, with the indicators' hue-keep stamp in a lit room; its clock starts on its
   first draw.
8. `npc_caught_at_post` still uses the object-param-only minigame test; only the workstation hold
   uses `minigameOnObject`. Worth aligning later (not in scope).

## Gotchas

- `window.game` is not the Phaser game; use `window.player.scene.game.loop` (`sleep`/`wake`) to
  freeze a frame. Evals and screenshots still work while it sleeps; scene timers pause with it.
- Task toasts are not hidden by `d.py`'s HIDE; judge from crops, or close them first.
- The camera follows the player, so crops need a centre per frame (`strip.py` takes `path@x,y`).
- `__test.needs.set(npc, need, level)` stages a trip; the leave comes after the wind-up (~1 s).
