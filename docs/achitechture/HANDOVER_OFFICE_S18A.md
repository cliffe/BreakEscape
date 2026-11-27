# Handover: office life slice 18a, coffee off (2026-11-06)

**Status: DONE (2026-11-06).** `bin/test-js` 404 files pass, live proof game 918, leash game 919 (pass), lab game 920
(score 100), docs written. Plan: `OFFICE_LIFE_PLAN.md` 12.4 "Slice 18a: coffee off" (the Built line lists the choices made without
asking), 12.8 row 3, 12.9 OQ43 and OQ44, 13f.

## Done (commits on main; `git log --oneline --grep "lice 18a"` after a rebase)

- 84babc54c engine, validator, schema, tests:
  - `npc-needs.js`: `affordance.offWhen` (the `requireGlobal` form) leaves a source out of the use and queue candidates (`_isOff`);
    `job.offWhen` copied at job start; in `_advanceJob`, before `_recheck`, a `use` job walking to (`goto_target`) or queued for a
    switched-off target turns back with reason `off`; one `using` it finishes. `TURN_BACK` table (`avoid`, `off`, `gone`, `answered`,
    `rang_out`; columns `mindChanged`, `grumble`, `fallback`, `parks`): only `avoid` sets `mindChanged`; `answered` and `rang_out` go
    straight home with no grumble; `_select` takes `exclude.noPark` for 18b's `job.tempted`. `_grumble(s, objectId, reason)` picks its
    topic first (`_grumbleTopic`: `grumble_<reason>` with lines, else `grumble` with lines, else the `grumble_<reason>` picture); an
    `off`/`gone` picture is the need's icon (`NEED_ICONS`), else `avoid`; the topic goes into `saying`, the speak info, `npc_overheard`
    and the `turned_back` log line (`grumble`). `PICTURE_CHATTER.grumble_off` and `grumble_gone`. `onGlobalChanged(name)` wakes parked
    needs (and clears back-offs) only when an `offWhen` object really goes from off to on, logging `switched_on` (`npc: null`);
    `installNpcNeeds` listens on `global_variable_changed:*`. `offWhenNames` exported.
  - Validator `check_off_when` (`validate_npc_needs.rb`): `offWhen` shape (error), each name declared in `globalVariables` (error),
    nothing in the scenario sets it (warning; `set_global` actions and mapping `setGlobal`, not ink), and a `hint` action with no
    `title` in a scenario with needs NPCs or `officePresets` (warning, naming the object or NPC).
  - Schema: `affordance.offWhen`; `hint` allowed in `triggerOnInteract` (9589e5bfd).
  - Tests: `test/js/npc-coffee-off.test.mjs` 12 (source removed, `{ name: value }` form, walker, queuer and user finishing, the
    `avoid` turn-back still possible after `off`, wake on a real change only, topic by lines including the lab's grumble-only case,
    picture icons and overheard topic, the table's `answered`/`rang_out`, determinism, the sims-day golden, validator fixtures). No new
    static imports. `GOLDEN_SIMS_DAY` unchanged.
- 9589e5bfd showcase (`test_needs_sims`): `office_coffee_off` global; `office_coffee` `offWhen`; `office_coffee_socket`
  (`wall_socket1`, approved art 9742108c2) at (9.05, 7.3) on the east wall beside the machine, `triggerOnInteract` `set_global` plus the
  hint "The coffee machine is switched off at the wall." titled "Wall socket"; `grumble_off` and `grumble_gone` scenario pools; task
  `see_coffee_off` (mappings `npc_turned_back:*` with reason `off`, `npc_used:kitchen_coffee` with `globalVars.office_coffee_off`);
  `see_turned_back` now needs reason `avoid`; `game.js` preloads `wall_socket1`. Validator: 28 warnings before and after, none new.
- This commit: plan 12.4 Built line, sims README section, session handover row, lab log line, this file.

## Live proof (:3001, headless; evidence in the session scratchpad `s18a/`)

- **Game 918.** Kitchen door opened, player at feet (272, 244) beside the socket, Tom sent for coffee (`__test.needs.set`). The click
  while he walked: `turned_back reason off grumble grumble_off`, "Who switched the coffee off?", hint toast "Wall socket", new job
  `kitchen_coffee`, `used` there at tick 187; `see_coffee_off` completed (`verify-918.txt`). Full frames
  `walker-a1-walking-918.png`, `walker-b-turnback-grumble-918.png`, `walker-c-to-kitchen-918.png`. After switching back on through
  `applyActions` (`switched_on` logged each time): a click after Tom had started pouring (he finished, `using-finishes-b-hint-918.png`),
  and an in-page timed click (`near.py`) that caught him three tiles out: picture grumble with the coffee-cup icon, as his bark was on
  cooldown (`near-turnback-918.png`). Drains: only the keyless TTS 503 (the voiced grumble's request).

## Left

Nothing for this slice. For later slices:

1. **18b** uses the `gone` row and `exclude.noPark` for `job.tempted`; `_grumble` already picks `grumble_gone` and the showcase has the
   pool ("Missed it.").
2. **19** turns back with `answered` and `rang_out` through `_turnBack(s, reason)`; it must drop the claimed call itself.
3. **TTS audio** for the new `grumble_off` and `grumble_gone` lines is not generated (keyless server); top up with the tts-audio skill
   when the showcase is voiced.
4. The playtest bridge's `interact()` can report a confirmed interaction from an unrelated event while the player is out of reach
   (game 917: "approached-then-interacted, confirmed" via `npc_arrived:tom`, `targetUnverified: true`). Not fixed here.

## How the live proof was run (for re-runs)

- `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_needs_sims`,
  `tools/playtest/session-start.sh --url <url> --headless --log <scratchpad>/s18a/sess<id>.jsonl`, then `bootstrap`, then
  `moveTo` (154, 82) to clear the desks.
- `s18a/beat.py <game> <npc> [near]`: records events and alerts, enters the kitchen (opens the door), stands at feet (276, 246), waits
  until the NPC is idle at its desk and the machine is free, sets its caffeine to 10, clicks the socket centre with a real pointer
  (`__test.clickAt`), follows the NPC to the kitchen. `s18a/near.py <game> <npc> <px>` switches the machine back on, then clicks from
  an in-page watcher when the NPC is within `<px>` of the approach cell and freezes the loop 150 ms later for the frame.
- Regressions: `scratchpad/leash.py <game>` on a `test_needs_leash` game; the lab by replaying `s21/lab_cmds.json` without `quit`
  (`s18a/lab_args920.json`) through `scratchpad/lab.py`, then `verify-run.rb`.

## Gotchas

- The socket is in reach only from close by (feet about (272, 244)); from (262, 214) a click walks the player instead.
- A free kitchen machine wins over a queue place at the office one, so with the kitchen open nobody queues there; the queuer
  turn-back is covered by the node test.
- The switch is one-way; to re-run on one game, set the global false with `applyActions([{ type: 'set_global', key:
  'office_coffee_off', value: false }])` (imported from `/break_escape/js/systems/apply-actions.js`).
