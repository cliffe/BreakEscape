# Handover: office life slice 11, left-behind items and queue-aware expectedAwayMs (2026-11-06)

**Status: built, unit-tested, committed and proven live in `test_needs_sims` (game 684). Regressions
done on keyless :3001, headless: `test_needs_leash` game 686 (pass: leashed 0 of 43 samples on Maya's
floor, unleashed 14 of 34), `lab_physical_pentest` game 685 (score 100, 9/9 tasks).** Plan:
`OFFICE_LIFE_PLAN.md` 2.10 (Built line lists the choices made without asking). Behaviour reference:
`NPC_NEEDS_SYSTEM.md` 3.3b, 5.7, 7, 10, 11. Slice 11 was the last chosen slice.

## Done
- Engine (`systems/npc-needs.js`): `s.leaveCount`, `s.leftItems`; `_leaveItemsBehind` (seeded roll
  `left:<leaveCount>:<itemId>` per real leave), `_collectLeftItems` on `npc_returned_post`; log
  entries `left_behind`, `stowed` (`reason: collected`), `left_item_gone`; event
  `npc_left_item_gone:<npcId>`; `npc_left_post.leftBehind`; queued `expectedAwayMs` adds
  `ceil(place / capacity) × useSeconds`; `getState()` gains `leaveCount`, `leftItems`. Adapter:
  `leftBehindItems(npcId)`, `revealLeftBehind(itemId, npcId)` (depth lifted above the owner's
  `needsHome` object within two tiles). Stow uses the slice 7 `stowSlot` / stow on sight.
- Shared files touched: `scripts/validate_npc_needs.rb` (`check_left_behind`),
  `scripts/validate_scenario.rb` (known fields), `scripts/scenario-schema.json` (`leftBehindBy`,
  `leftBehindChance`). No new static imports, so no harness copy lists changed.
- Tests: `test/js/npc-left-behind.test.mjs` (15), fixture `addLeftBehind` in
  `test/js/fixtures/needs-sims-world.mjs`. `bin/test-js`: 394 files, all pass (before the depth
  follow-up; the new file passes after it).
- Showcase: `tom_badge`, task `see_left_behind`, Tom's mappings (objective, bark on
  `npc_left_item_gone:tom`), README slice 11 table.
- Docs: plan 2.10 Built line, session table row, `NPC_NEEDS_SYSTEM.md`, lab log line (with what
  expansion step 9 must declare).

## Left
Nothing open in slice 11. All chosen slices are built. Expansion step 9 of the lab is the other
session's (see the lab log line).

## Gotchas
- Desk dressing objects share the desk's depth; a declared item on a desk is hidden behind them
  unless lifted (done for left-behind items only).
- Live leaves are fastest by `window.__test.needs.set('<npc>', 'caffeine', 5)`.
- After `location.reload()`, `bootstrap` with `resume: "resume"` clears the Continue card.
- Driver: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s11/drive.py`
  (modes `st`, `leave <tag> [stop]`, `shot`, `crop`, `log`).
