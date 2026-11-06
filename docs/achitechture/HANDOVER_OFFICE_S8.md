# Handover: office life slice 8, speech bubbles and social pairing (2026-11-06)

**Status: built, unit-tested, committed and proven live in `test_needs_sims` (games 665, 667).
Regressions not run yet: `test_needs_leash`, then one `lab_physical_pentest` run, then the lab log
line.** Plan: `OFFICE_LIFE_PLAN.md` 2.4 and 7.3 (Built lines list the choices made without asking).

## Done
- Engine (`systems/npc-needs.js`): `_maybePair` on entering `using`, `_tickChats` (timing, chattiness,
  overlap, hush, overheard), `_compatible` / `_avoids` / `_avoidsOneWay` (ids, `group:`, `"*"`,
  object entries with `requireGlobal`), the `_free` avoidance check (only when some NPC has
  `needsCompany`), `npc_avoided` with dedupe (`avoidNoted`, reset at job start), `getState().talking`
  and `chatPartner`. Exports `bubbleMs`, `chatterPool`, `normalisePool`, `DEFAULT_CHATTER`,
  `requiredGlobalsHold` (copied from `npc-sight-challenge.js`, review m10). Adapter: `playerHears`,
  `chatterConfig`, `globalHolds`, `besideCell`.
- New `systems/npc-world-bubbles.js` (dynamic import in `core/game.js`, so no harness copy lists
  changed). `npc-action-icons.js` hides the icon and the thought bubble while `st.talking`.
- `data/office-presets.json`: cooler preset gains `"chatter": "cooler"`.
- Validator `check_social` in `scripts/validate_npc_needs.rb`; schema (`chatter` scenario/NPC/
  affordance, `overhearRadius`, `chattiness`, `needsCompany`); `validate_scenario.rb` known fields.
- Tests: `test/js/npc-social-pairing.test.mjs` (25 tests); `office-presets.test.mjs` expectation.
  `bin/test-js`: 390 files, all pass (after the presets fix).
- Showcase: Marek Nowak (`marek`, `male_telecom_v2`, `needsCompany: { avoids: ["*"] }`), Kitchen
  Rota, Activity Board mappings on Sanjay and Rosa, Sanjay's `npc_left_post:marek` mapping, cooler
  pool, tasks `see_chat` and `see_outcast`, ink `ink/marek.ink`/`.json`, dungeon graph regenerated.
- Docs: plan Built lines (2.4, 7.3), session handover table row, `NPC_NEEDS_SYSTEM.md` 5.6 and
  section 7 events, sims README cast row and "Slice 8 re-run" table.
- Shared engine files touched: `core/game.js` (one dynamic-import line), `scripts/scenario-schema.json`,
  `scripts/validate_scenario.rb`. Not touched: `npc-behavior.js`, `rooms.js`.
- Commits (hashes after the other session's rebase): 0af49071a (engine), 224a177c2 (showcase),
  3a51f2aac (presets test), 40d8c3ea3 (Sanjay mapping), plus this docs commit.

## Left (exact next steps)
1. `test_needs_leash` regression, recipe in `HANDOVER_OFFICE_S7.md` "Left" 1 (leashed Ravi 0 samples
   on Maya's floor, unleashed cuts through). The leash scenario has a water cooler with the cooler
   preset, so it now has a chatter topic; if two NPCs meet there, bubbles appear (expected).
2. One lab run per `OFFICE_LIFE_HANDOVER_SESSION.md` section 4 (Haiku agent; recipe and gotchas in
   the brief that launched slice 8: bootstrap `{"tutorial":"decline","resume":"new"}`,
   `session-start.sh --headless`, `waitFor` global takes `name`, wait on `len_at_door` not
   `door_gate_opened`, hi-vis before the records door, USB drop is `openInventoryItem` with
   `item: kit_deviceB` beside Sofia's PC, `mg close` on Len's chat before `ruth_debrief`). Pass:
   `verify-run.rb` score 100, no "No path found"/"Failed to escape wall", `drain` before stopping.
   The lab has no cooler and no `needsCompany`, so its decisions should be unchanged.
3. Add the slice 8 line to "Office-life slices" at the end of
   `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md` (commits, lab game id, score); add the
   leash and lab game ids to the plan 2.4 Built line and the session handover row; commit.

## Gotchas
- With both NPCs' needs set at once, whoever already held the cooler decides the outcome (Grace
  often does). That is why Sanjay's urge follows `npc_left_post:marek`.
- The Kitchen Rota is placed automatically; `interact` sometimes reports `no-effect-confirmed`.
  `moveToNear` first, then `interact`, then `mg close` (it opens the notes minigame).
- The Activity Board opens a `gameDisplay` overlay: close it by clicking its Close button
  (`dismiss` reports `ambiguous-blocking-ui`).
- Commit hashes changed under a rebase mid-session (VS Code sync); look them up with
  `git log --oneline --grep "slice 8"`.
- Minor visual finding: the two NPCs at the cooler can overlap by half a body (NPC bodies push).
  Left for slice 10's queue cells.
- Live driver: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s8/drive.py`
  (modes `state`, `watch`, `shot`, `hide`, `cmd`, `ev`) and `vis.py` (`dark` | `other`).
