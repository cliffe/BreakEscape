# Handover: office life slice 7, carry outcomes and reveal slots (2026-11-06)

**Status: built, unit-tested, committed and proven live in `test_needs_sims` (game 643). Open: the
`test_needs_leash` regression, the `lab_physical_pentest` regression run and its log line.** Plan:
`OFFICE_LIFE_PLAN.md` 2.2 Part A (Built line lists the choices made without asking).

## Done
- Engine (`systems/npc-needs.js`): outcome by item kind in `_completeJob` (plain consumed as before;
  slot placed, or stowed with `onDeliver: "stow"`); `placeSeconds` timers on the needs clock
  (`_placed`, `_tickPlaced`); `onUse.revealOutput` (`_revealOutput`, cosmetic fallback); stow on
  sight in `_onRoomsLoaded`; `npc_job_failed` `item_gone` on both paths (`_itemGone`); an abort while
  carrying a slot stows it. Adapter: `describe` marks `slot` and treats a placed slot as not pickable;
  `placeHeld`, `stowHeld`, `stowSlot`, `revealOutput`, `removeCosmetic`, `stowRevealedSlots`; slot
  home recorded on first handling (`sp._slotHome`).
- Shared files touched: `core/rooms.js` (exports `showRevealedObject`, new `hideRevealedObject`, both
  also on `window`), `scripts/validate_npc_needs.rb` (`check_slots`, `onUse.revealOutput`),
  `scripts/validate_scenario.rb` (`outputOf` known field; pinned-proximity skip for slots),
  `scripts/scenario-schema.json` (`onDeliver`, `placeAt`, `placeSeconds`, `outputOf`,
  `onUse.revealOutput`). No new static imports, so no harness copy lists changed.
- Tests: `test/js/npc-needs-slots.test.mjs` (18), fixture `addCopierBeat` in
  `test/js/fixtures/needs-sims-world.mjs`, `validator-office-presets.test.mjs` list gains
  `office_copier`. `bin/test-js`: 388 files, all pass after that list fix.
- Showcase and README slice 7 table; `NPC_NEEDS_SYSTEM.md` 3.2, new 3.3a, 7, 10, 11.
- Commits: fcb8817a4 (slice), f97960f2e (parcel global mapping), 3ff1efa29 (slot depth, tray spot).

## Left
1. `test_needs_leash` live regression. A script from slice 5 exists at
   `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/s5/leash6.py`
   (read it first; it expects a fresh leash game). Pass as in the sims README "Re-run on a quiet
   machine" note (game 630): leashed Ravi takes the long way, 0 samples on Maya's floor, no errors.
2. `lab_physical_pentest` regression: one run per `OFFICE_LIFE_HANDOVER_SESSION.md` section 4 (Haiku
   is fine): `verify-run.rb` score 100, no "No path found"/"Failed to escape wall" for staff, no
   console errors, `drain` before stopping. The lab declares no `outputOf` slots, so slice 7 should
   change nothing there except that `rooms.js` now sets two `window` functions.
3. Then add one line to the "Office-life slices" note at the end of
   `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md`: slice 7, commits fcb8817a4, 3ff1efa29,
   f97960f2e (and the docs commit), lab game id, score. That line is the only lab file to touch.
4. Update the handover session table row for slice 7 once 1-2 pass.

## Gotchas
- `session-start.sh` needs `--headless`, or the harness launches a headed browser and fails after
  120 s with "window.__test never appeared".
- My own headless browser used about 9 cores (software GPU); the load average stays near 12 while
  one runs, so "wait for load below 12" cannot succeed with a session open. Check what else runs.
- `pkill -f "cmd.sh <id>"` matches the calling shell's own command line and kills it. Don't.
- `python3 drive.py <game> cmd ...` truncates replies at 1500 chars; use `cmd.sh` to a file for `drain`.
- Live driver: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s7/drive.py`
  (modes `cycle`, `print`, `restore`, `poll`, `southprint`).
