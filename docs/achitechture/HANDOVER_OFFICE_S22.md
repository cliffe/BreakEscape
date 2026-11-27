# Handover: office life slice 22, printer power (2026-11-07)

**Status: DONE (2026-11-07).** `bin/test-js` 409 files pass, live proof game 973, leash game 974 (pass), lab game 975 (score 100),
docs written. Plan: `OFFICE_LIFE_PLAN.md` 12.12 (the spec and the Built line, which lists the choices made without asking).

The user's request (2026-11-07): a way to disrupt printers like the coffee switch, so NPCs re-route their needs and seek a printer in
a nearby room, giving the player more time with them out of the room.

## Done (commits on main; `git log --oneline --grep "lice 22"` after a rebase)

- f650c1a5f plan 12.12 (written and committed before any code).
- 9da18dfc9 engine, validator, schema, tests:
  - `npc-needs.js`: `printerList(v)` (exported, pure); `_pickProducer(list)`: the first listed producer that is on (`_isOff` on
    `affordance.offWhen`) with a free or recyclable slot, else the first that is on (today's full-pool path), else none; an
    unknown producer (room not loaded) is off in a list of two or more, a list of one keeps the old behaviour. Used at job start
    (the printing icon only when one is on with a slot) and at completion (the producer is chosen then), and by the `needs.print`
    command (string, list or `{ producer: list }`). `_printBlocked(s, objectId, list, viaCommand)`: log `print_blocked`, event
    `npc_print_blocked:<npcId>` `{ npcId, objectId, producers, viaCommand, playerNearby, playerDistance }`, and at the desk a
    `grumble_printer_off` line or the `blocked` picture (`PICTURE_CHATTER.grumble_printer_off`); no grumble for a command.
    `revealed` logs `skipped` only when a producer was passed over. `npc_print_fetched` gains `producerId`. No new rolls; the errand
    and `_expectedAwayMs` were already routed through the slot, so the longer trip needed no code.
  - Validator: `revealOutput` and `needs.print` lists (each id an object, error; an empty list, error; a repeated id, warning; no
    `outputOf` slots, warning; the owner's leash or a private room keeping it from a listed printer, warning, now naming both).
    Schema: string or array for `revealOutput`, `needs.print` and its `producer`.
  - Tests: `test/js/npc-printer-power.test.mjs` 14 (list order, fallback past off and past full, none on with a line and with the
    picture, string hook, unloaded room, the errand to the kitchen copier with the longer `expectedAwayMs` and `producerId`,
    switching off later, the command with a list and blocked, determinism, a copier as a need source turning back through 18a,
    validator fixtures). `npc-print-forget.test.mjs`: one exact-payload assertion gained `producerId`. No new static imports.
    `GOLDEN_SIMS_DAY` unchanged.
- e787ce25b, 9053df59e, 9600031e4 showcase (`test_needs_sims`): `kitchen_copier` (photocopier1, (7.9, 7.3), south-east corner
  square to the east wall, clear of the door) with slots `kitchen_out_a` and `kitchen_out_b` (read in place) and
  `kitchen_copier_socket` (9.05, 6.4); `office_copier_socket` (5.6, 1.75) beside the office copier; `offWhen` on both copiers
  (`office_copier_off`, `kitchen_copier_off`); Tom's hook and both levers list the two copiers; scenario pool `grumble_printer_off`
  (three lines, no room names); tasks `keep_tom_away` (`npc_print_fetched:tom` with `producerId === 'kitchen_copier'`) and
  `see_printer_grumble` (`npc_print_blocked:tom`). Validated with `--no-graph`: no new errors; one new warning (two `onceOnly`
  mappings on `npc_print_fetched:tom` that may fire together, which is intended).
- This commit: plan Built line, sims README section, session handover row, lab log line, this file.

## Live proof (:3001, headless; evidence in the session scratchpad `s22/`)

Game 973; see the sims README "Slice 22" table. Copier on: expectedAwayMs 2307, away 3.25 s. Copier off (socket clicked, hint
shown): the print at `kitchen_out_a`, expectedAwayMs 4482, away 10.25 s, `keep_tom_away` complete. Both off: Tom's ninth work use
(seeded) gave `npc_print_blocked:tom` and "Is anything switched on today?", `see_printer_grumble` complete. No console errors.

## Regressions

- Leash game 974: pass (leashed 0 samples on Maya's floor in 28 s; unleashed 6 in 23 s; the same as game 967).
- Lab game 975: score 100, 9/9 tasks; creds 64.6 s, USB foothold 11.2 s (9.5 s in game 968, 10.1 s in game 926). The lab has no
  `revealOutput`, print command or `offWhen`, so slice 22 cannot reach it; the run came after the other session's blind R1 fixes
  (64adffe2f), and the USB figure is within run-to-run spread of the replay.

## Left

Nothing for this slice. For later:

1. **TTS audio** for the three `grumble_printer_off` lines is not generated (keyless server).
2. Tom's lock is a coin flip per leave, so the showcase does not show a longer trip changing a lock decision; a scenario wanting that
   gives the owner `screenHabit.lockIfAwayOverSeconds` (slice 16). Not added, to keep the slice 16/17 beats as they are.
3. The lab could adopt it (12.10, slice 17 notes): its shared printer and post-room copier could be listed producers with sockets.
4. `_expectedAwayMs` is a straight-line lower bound; through a door it underestimates (4.5 s against 10.25 s live). Unchanged.

## How the live proof was run (for re-runs)

- `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_needs_sims`,
  `tools/playtest/session-start.sh --url <url> --headless --log <scratchpad>/s22/sess<id>.jsonl`, `bootstrap`.
- `s22/proof.py <game> setup|a|off|b|c`: setup opens the kitchen and records events; `a` the errand with the copier on; `off` clicks
  the office socket (if Amara stands beside it a pick-one menu opens: choose its "Wall socket" button); `b` the errand with the
  copier off; `c` clicks the kitchen socket and sets Tom's work to 0 until a use prints (for seed `test_needs_sims` his ninth).
- Regressions: `scratchpad/leash.py <game>`; the lab by replaying `s18a/lab_args920.json` through `scratchpad/lab.py`, then
  `tools/playtest/verify-run.rb --tasks <game>`.
