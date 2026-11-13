# Handover: office life slice 8, speech bubbles and social pairing (2026-11-06)

**Status: built, unit-tested, committed and proven live in `test_needs_sims` (games 665, 667).
Regressions done 2026-11-06 on keyless :3001, headless: `test_needs_leash` game 668 (pass),
`lab_physical_pentest` game 669 (score 100).** Plan: `OFFICE_LIFE_PLAN.md` 2.4 and 7.3 (Built lines
list the choices made without asking).

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

## Left
Nothing open. Regressions run 2026-11-06:
1. `test_needs_leash`, game 668: leashed Ravi went ravi_office, west_corridor, store, west_corridor,
   ravi_office, 0 of 45 samples on Maya's floor, 27 s; unleashed he cut through `maya_office`, 12 of 33
   samples, 21 s. No page errors.
2. `lab_physical_pentest`, game 669: `verify-run.rb` score 100, 9/9 tasks. Keylogger captured creds
   (about 53 s), BadUSB foothold, Len opened secure_area and `kp_badge_tailgated` was true on entry,
   debrief closed the engagement. No "No path found" or "Failed to escape wall"; the only console
   errors were keyless-server TTS 503s (40). Decisions unchanged, as expected (no cooler, no
   `needsCompany` in the lab).
3. Lab log line added to "Office-life slices"; plan 2.4 Built line and session table row updated.

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
