# Handover: office life slice 10, queues at shared machines (2026-11-06)

**Status: built, unit-tested, committed and proven live in `test_needs_sims` (games 675, 676, 679).
Regressions done on keyless :3001, headless: `test_needs_leash` game 681 (pass), `lab_physical_pentest`
game 680 (score 100).** Plan: `OFFICE_LIFE_PLAN.md` 2.5 (Built line lists the choices made without
asking) and 7.3. Behaviour reference: `NPC_NEEDS_SYSTEM.md` 5.7.

## Done
- Engine (`systems/npc-needs.js`): `affordance.queue`, phase `queued`, `_queueCfg`, `_queueCells`,
  `_queuers`, `_queuePlace` (skips cells in rooms forbidden to the queuer), `_queueCandidate`,
  `_advanceQueued`, `_leaveQueue`, `_tickQueueChats`; `_claims` skips queued jobs; `_free` lets only
  the front take a freed place; event `npc_queued:<objectId>`; `getState().job.queuePlace`; adapter
  `queueCells`. Exports `QUEUE_MAX_WAIT_S`, `QUEUE_COOLDOWN_MS`, `QUEUE_CHAT_RADIUS`.
- `npc-action-icons.js`: a queued job shows `queue` only.
- `data/office-presets.json`: coffee preset queues two `(-1,1), (-2,1)`; cooler preset `useFrom 0,1`.
- Shared engine file: `npc-behavior.js` `goToAndStay` option `arriveWithin` (needs job moves pass 6 px;
  the 1-tile stop is a 1.5 s fallback). Fixes the slice 8 leftovers: cooler pair two tiles north and
  half overlapping. No new static imports.
- Validator `check_queues` in `scripts/validate_npc_needs.rb`; schema `affordance.queue` (object or false).
- Tests: `test/js/npc-queues.test.mjs` (18); `needs-sims-world.mjs` has opt-in `queues` (default off, so
  earlier golden days are unchanged); `office-presets.test.mjs` cooler expectation. `bin/test-js`: 393
  files, all pass.
- Showcase: coffee pool, office_coffee queue along the bottom row, kitchen_coffee queue, kettle
  `queue: false`, Marek's caffeine need and post moved to (3,8), Board and `npc_queued` mappings, tasks
  `see_queue` and `see_queue_chat`, README slice 10 table.
- Docs: plan 2.5 and 7.3 Built lines, session table row, `NPC_NEEDS_SYSTEM.md` 5.7 and events, lab log line.

## Left
Nothing open in slice 10. Slice 11 (left-behind items, queue-aware `expectedAwayMs`) is next.

## Gotchas
- A free machine anywhere permitted beats a queue: in the showcase the queue needs the kitchen shut.
- `interact` aimed at the Activity Board sometimes reads the Deadline Memo.
- The hover observation box covers the bottom row of the office in screenshots when the player stands
  next to an object; stand in open floor.
- Live drivers: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s10/`
  (`drive.py`, `qwatch.py <game> <secs> <tag> [ids]`, `incompat.py`).
