# Handover: office life slice 21, idle chair roll, rare swivel and looking round (2026-11-06)

**Status: DONE (2026-11-06).** `bin/test-js` 402 files pass, live proof games 896 and 897, leash game
899 (pass), lab game 900 (score 100), docs written. Plan: `OFFICE_LIFE_PLAN.md` 12.7 (the Built line
lists the choices made without asking).

## Done (commits on main; look them up with `git log --oneline --grep "slice 21"` after a rebase)

- 9779363f6 engine, validator, schema, tests:
  - `seating.js`: `fidgetOffset` retuned (x within 3 px, y within 1, never towards the desk; a facing
    with an east or west part rolls only away along x, 1 to 2 px; never a zero roll); `newFidget` and
    `fidgetStep` (wait 4-11 s, out 700 ms, hold 1-2 s, back 700 ms; `held` starts none and brings a
    roll that is out straight back), still `Math.random`; `isTyping`, `idleMotionHeld`,
    `swivelFacing` (seeded `roll('swivel:' + slot)` per 6 s slot, `SWIVEL_CHANCE` 0.05, one compass
    step snapped to `valid`, hold 2-4 s, never typing), `listenTarget` (nearest speaker in the room
    within `LISTEN_RADIUS` 128 px while `until > clockMs`), `swivelEnabled` (`swivel: false`,
    `"officeVisuals": false`, `los.enabled` turn it off). `updateNeedsSeat` order: player chat, then
    held (home), then listening, then the idle swivel; emits `npc_swivelled:<id>` `{ npcId, facing,
    reason }` on each turn away from home.
  - `npc-needs.js`: `this.speakers`, rebuilt once per tick by `_buildSpeakers()` after `_tickChats`
    (chat/exchange/picture lines and grumbles; `{ npcId, roomId, x, y, until }`); reset with the rest.
  - Schema `swivel`, `swivelChance`; `validate_scenario.rb` known fields; `validate_npc_needs.rb`
    `check_swivel` (warnings: swivel fields on an NPC with no needs; `los.enabled` on a needs NPC
    without `swivel: false`; error: `swivelChance` outside 0-1).
  - Tests: `seating.test.mjs` 33 (11 new, including the live `updateSeatedNPC` path with stub sprites),
    `npc-office-visuals.test.mjs` 24 (validator). The sims-day golden (`npc-needs-slots.test.mjs`) is
    unchanged. No new static imports.
- cbfe37bea showcase: task `see_look_round`, mapping `npc_swivelled:*` with `reason === 'listen'` on
  Amara's mapping list.
- This commit: plan 12.7 Built line, sims README section, session handover row, lab log line, this file.

## Left

Nothing for this slice. For later slices:

1. **Slice 19 must add call speakers** to `_buildSpeakers` (the plan's "colleagues look round at Tom on
   the phone"); the `ns.call` hold is already read in `updateNeedsSeat`, so a truthy `s.call` stops the
   roll and the swivel.
2. The lab uses static seats, so it is unaffected; if it moves staff onto Tiled swivel chairs, any with
   `los.enabled` should set `"swivel": false` (the validator warns).

## How the live proof was run (for re-runs)

- `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_needs_sims`,
  `tools/playtest/session-start.sh --url <url> --headless --log <scratchpad>/s21/sess<id>.jsonl`, then
  `bootstrap {"tutorial":"decline","resume":"new"}`.
- Move the player clear of the desks first: from the spawn, `moveTo` (154,82) then (250,190) (feet
  coordinates); the gap between Sanjay's desk and Tom's chair traps the player.
- Scratchpad drivers: `s21/d.py` (cmd/ev/shot), `s21/strip.py` (fixed-centre crops and strips),
  `s21/roll.py <game> <npc>`, `s21/swiv.py <game> <npc|*> idle|listen <secs>`, `s21/listen.py <game>`
  (waits until the coffee is free, sets Marek's caffeine, freezes the clock on the first listen turn).
- Regressions: `scratchpad/leash.py <game>` on a `test_needs_leash` game; the lab by replaying the
  command list from game 788 (`s21/lab_cmds.json`, without `quit`) through `scratchpad/lab.py`, then
  `verify-run.rb`.

## Gotchas

- `gameScenario.objectives[].tasks[].status` is the scenario as loaded, not the live state: check task
  completion with `verify-run.rb` or the objectives manager.
- The Coffee Notice's mappings have cooldowns and fire once; a second read in the same game may not
  send Marek. Sanjay also parks at once (no grumble) if Marek already holds a queue claim when he
  decides; wait until the coffee is free before starting the beat.
- Freeze the needs clock (`npcNeedsSystem.manualClock = true`) to hold a swivel or listen turn for a
  screenshot; the roll runs on scene time and cannot be frozen that way, so catch it by polling for the
  `hold` phase.
