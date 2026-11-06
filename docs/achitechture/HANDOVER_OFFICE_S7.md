# Handover: office life slice 7, carry outcomes and reveal slots (2026-11-06)

**Status: built, unit-tested, committed and proven live in `test_needs_sims` (game 643). Regressions
done 2026-11-06: `test_needs_leash` game 645, `lab_physical_pentest` game 646 (score 100).** Plan:
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
Nothing open. Regressions run 2026-11-06 on keyless :3001, headless:
1. `test_needs_leash`, game 645: leashed Ravi went ravi_office, west_corridor, store and back, 0 of 46
   samples on Maya's floor, 28 s; unleashed he cut through `maya_office`, 11 of 30 samples. No page
   errors.
2. `lab_physical_pentest`, game 646: `verify-run.rb` score 100, 9/9 tasks (the lab now lists more optional
   tasks; none were played). Keylogger and USB beats fired, Len opened secure_area (`door_gate_opened`),
   `kp_badge_tailgated` true, debrief closed the engagement and showed credits. No "No path found" or
   "Failed to escape wall" in the session log; the only console errors were keyless-server TTS 503s.
3. Lab log line added to "Office-life slices" in `IMPROVEMENT_LOOP_LOG.md`; session table row updated.

## Gotchas
- `session-start.sh` needs `--headless`, or the harness launches a headed browser and fails after
  120 s with "window.__test never appeared".
- My own headless browser used about 9 cores (software GPU); the load average stays near 12 while
  one runs, so "wait for load below 12" cannot succeed with a session open. Check what else runs.
- `pkill -f "cmd.sh <id>"` matches the calling shell's own command line and kills it. Don't.
- `python3 drive.py <game> cmd ...` truncates replies at 1500 chars; use `cmd.sh` to a file for `drain`.
- Live driver: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s7/drive.py`
  (modes `cycle`, `print`, `restore`, `poll`, `southprint`).
