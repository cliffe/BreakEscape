# Handover: office life slice 17, print and forget (2026-11-06)

**Status: DONE (2026-11-06).** `bin/test-js` 405 files pass, live proof games 923 and 924, leash game 925 (pass: leashed Ravi went the long way (0 samples in maya_office, 28 s), unleashed through maya_office (8 samples, 23 s), the same as game 919), lab game 926
(score 100), docs written. Plan: `OFFICE_LIFE_PLAN.md` 12.3 (spec and the Built line, which lists the choices made without asking),
12.8 row 4, 12.9 OQ30, OQ51, OQ56, OQ58, OQ59, 13f.

## Done (commits on main; `git log --oneline --grep "lice 17"` after a rebase)

- 351fb11fe engine, validator, schema, tests:
  - `npc-needs.js`: `revealOutput` fires only for a need use (`job.need && !job.carrying`) and only when the start-time roll said so
    (`onUse.*.chance`, `roll(npc, 'print:' + useCount)`, `useCount` per object in `s.useCounts`); `s.job.prints` (the icon) only
    when the producer has a free or recyclable slot (`_slotAvailable`). An owned print (`printHabit`, or the new `needs.print`
    command) goes into `this._prints` (slotId to `{ ownerId, producerId, at, dueAt, forgotten, viaCommand, weight, uncollectedAt,
    shareAt, readInPlace, uncollected, errand }`); rolls `print_forget:<n>` and `print_due:<n>` on the owner's `printCount`.
    `_reservedFrom` filters other NPCs' carry candidates; `_errandCandidate` (from `_select`, after interests, earliest due first,
    weight 2) carries the slot to the `needsHome` object with no `accepts` check; `_dueErrand` widens `_select`'s early return.
    `job.errand`: the caught check in `_advanceJob` only while `job.errand && job.carrying && !s.atPost && !s.caughtEmitted`; on
    arrival `_completeJob` straight away (no `using`), which places the slot, emits `npc_used:<home>` (need null) and
    `npc_print_fetched:<owner>` `{ slotId, viaCommand }`, then `_goHome(s)`; `_expectedAwayMs` drops the dwell. `_tickPrints`:
    `npc_print_gone` at the due time for a print taken first, `npc_print_uncollected` once after the producer's
    `uncollectedAfterSeconds` (default 60), `shareAfterSeconds` releases. `_revealOutput(producer, npc, own)`: with no free slot
    (`world.freeSlotOf`) it recycles the oldest forgotten slot of that producer (read-in-place first) for any print, logging
    `recycled`; with none, `print_no_slot` and today's cosmetic copy. A stowed, filed or recycled slot leaves `_prints`.
    `control(npc, { print })`. Adapter: `slotsOf`/`freeSlot` helpers, `freeSlotOf`, `setPrintedBy`, `_printedBy` set or cleared
    on every reveal and cleared on stow, `describe` gives slots `takeable`.
  - Validator `check_print_habits`; `printHabit` in the known NPC fields; schema `printHabit`, `onUse.*.chance`,
    `affordance.uncollectedAfterSeconds`, `needs.print`.
  - Tests: `test/js/npc-print-forget.test.mjs` 15 (most with the tick cache on and off). Fixture `addCopierBeat` gains
    `freeSlotOf`, `setPrintedBy`, `extraSlots`, `uncollectedAfterSeconds`. No new static imports. `GOLDEN_SIMS_DAY` unchanged. In
    `npc-needs-slots.test.mjs` only the validator assertion on the showcase's pool size changed (3 to 5 slots, the plan's d and e).
- 6e253b502 showcase (`test_needs_sims`): Tom's hook with `chance` 0.4 and `printHabit`; the two levers on Tom (open PC, Print
  Queue note), each `cooldown` 60000; copier `uncollectedAfterSeconds` 150; slots d and e; tasks `see_uncollected`,
  `send_print_job`; Amara's `npc_used:tom_pc` mappings need `data.need === "work"`. Validator: 28 warnings before and after.
- da3a984db fix from the live proof: `playerAtPost` matches the examine view's string `itemId` (game 923 reported
  `inMinigame: false` with the view open on `tom_pc`; game 924 `true`).
- This commit: plan 12.3 Built line, sims README section, session handover row, lab log line, this file.

## Live proof (:3001, headless; evidence in the session scratchpad `s17/`)

See the sims README "Slice 17 re-run" table. Game 923: note lever (forgotten print, still there at 2 min, uncollected at 150 s),
lever from Tom's open PC with the player in the examine view (errand from idle, caught on the leg back). Game 924: the same lever
with the view closed (errand from returning: one caught across the walk and the errand; tray, in-hand and on-desk frames), then in
the view after the fix (`inMinigame: true`).

## Regressions

- Leash game 925: pass: leashed Ravi went the long way (0 samples in maya_office, 28 s), unleashed through maya_office (8 samples, 23 s), the same as game 919.
- Lab game 926: score 100, 9/9 tasks; keylogger creds 64.5 s and USB foothold 10.1 s, against 64.2 s and 10.1 s in game 920 (the game 788 command replay, `s18a/lab_args920.json`). The lab has no `revealOutput` hook, `printHabit` or print command, and Sofia's carries to `usb_target_pc` never set `job.errand`, so the 6 s plug-in dwell is kept; the timings did not move.

## Left

Nothing for this slice. For later slices:

1. **18b-i** extends `_select`'s early-return guard (`_dueErrand`) with "a known magnet in the tempt band".
2. Tom's natural hook prints were not waited for live (one work use in about 7.5 minutes, chance 0.4); node tests cover them.
3. The bridge's `interact()` cannot reach the Print Queue note from where it stops (33 px against 26); `s17/click.py` walks to
   feet about (157, 196) and clicks with a real pointer.

## How the live proof was run (for re-runs)

- `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_needs_sims`, then
  `tools/playtest/session-start.sh --url <url> --headless --log <scratchpad>/s17/sess<id>.jsonl`, `bootstrap`, `moveTo` (154, 82).
- `s17/click.py <game> print_queue_note 154 200` (the note lever); `s17/unc.py <game> <printClockMs>` waits for the uncollected event
  by the copier; `s17/away.py <game>` sends Tom for coffee until he leaves his screen open; `s17/pc.py <game> <tag> stay|leave`
  clicks `tom_pc` from feet about (109, 196), keeps or closes the examine view, and screenshots the tray, the hand and the desk.
- Regressions: `scratchpad/leash.py <game>`; the lab by replaying `s18a/lab_args920.json` through `scratchpad/lab.py`
  (`s17/regress.sh`), then `verify-run.rb`.
